#![allow(dead_code)]
//! Biquad IIR filter implementation for the 10-band graphic EQ.
//!
//! Uses the RBJ Audio EQ Cookbook formulas:
//!   - Band 0  (32 Hz)           → low shelf
//!   - Bands 1–8 (64 Hz–8 kHz)  → peaking EQ
//!   - Band 9  (16 kHz)          → high shelf

use std::f32::consts::PI;

/// ISO center frequencies for a 10-band graphic EQ.
pub const EQ_FREQUENCIES: [f32; 10] = [
    32.0, 64.0, 125.0, 250.0, 500.0, 1_000.0, 2_000.0, 4_000.0, 8_000.0, 16_000.0,
];

/// Q factor for peaking bands — √2 gives a 1-octave bandwidth.
pub const EQ_Q: f32 = std::f32::consts::SQRT_2;

// ---------------------------------------------------------------------------
// BiquadCoeffs
// ---------------------------------------------------------------------------

/// Normalized biquad IIR coefficients (a0 divided out).
/// Direct Form I: y = b0·x + b1·x[-1] + b2·x[-2] − a1·y[-1] − a2·y[-2]
#[derive(Debug, Clone, Copy)]
pub struct BiquadCoeffs {
    pub b0: f32,
    pub b1: f32,
    pub b2: f32,
    pub a1: f32,
    pub a2: f32,
}

impl BiquadCoeffs {
    /// Identity (pass-through) filter.
    pub fn identity() -> Self {
        Self { b0: 1.0, b1: 0.0, b2: 0.0, a1: 0.0, a2: 0.0 }
    }

    /// RBJ Cookbook low-pass filter. Q=0.707 (Butterworth) gives a clean sweep.
    pub fn lowpass(freq: f32, q: f32, sample_rate: f32) -> Self {
        let w0 = 2.0 * PI * freq / sample_rate;
        let alpha = w0.sin() / (2.0 * q);
        let cos_w0 = w0.cos();
        let a0 = 1.0 + alpha;
        Self {
            b0: ((1.0 - cos_w0) / 2.0) / a0,
            b1: (1.0 - cos_w0) / a0,
            b2: ((1.0 - cos_w0) / 2.0) / a0,
            a1: (-2.0 * cos_w0) / a0,
            a2: (1.0 - alpha) / a0,
        }
    }

    /// RBJ Cookbook high-pass filter. Q=0.707 (Butterworth) gives a clean sweep.
    pub fn highpass(freq: f32, q: f32, sample_rate: f32) -> Self {
        let w0 = 2.0 * PI * freq / sample_rate;
        let alpha = w0.sin() / (2.0 * q);
        let cos_w0 = w0.cos();
        let a0 = 1.0 + alpha;
        Self {
            b0: ((1.0 + cos_w0) / 2.0) / a0,
            b1: (-(1.0 + cos_w0)) / a0,
            b2: ((1.0 + cos_w0) / 2.0) / a0,
            a1: (-2.0 * cos_w0) / a0,
            a2: (1.0 - alpha) / a0,
        }
    }

    /// Returns true when this is a pure pass-through — allows skipping the
    /// per-sample multiply chain for bands with 0 dB gain.
    pub fn is_identity(&self) -> bool {
        self.b0 == 1.0
            && self.b1 == 0.0
            && self.b2 == 0.0
            && self.a1 == 0.0
            && self.a2 == 0.0
    }
}

// ---------------------------------------------------------------------------
// BiquadState
// ---------------------------------------------------------------------------

/// Per-channel biquad filter memory (Direct Form I history).
#[derive(Debug, Clone, Copy, Default)]
pub struct BiquadState {
    x1: f32,
    x2: f32,
    y1: f32,
    y2: f32,
}

impl BiquadState {
    /// Run one sample through the filter. Includes a denormal flush guard to
    /// prevent CPU stalls when audio fades to near-silence.
    #[inline(always)]
    pub fn process(&mut self, x: f32, c: &BiquadCoeffs) -> f32 {
        let y = c.b0 * x + c.b1 * self.x1 + c.b2 * self.x2
                         - c.a1 * self.y1 - c.a2 * self.y2;
        // Flush denormals (values ~1e-38) to zero — avoids FPU slow-path on x86
        let y = if y.abs() < 1e-15 { 0.0 } else { y };
        self.x2 = self.x1;
        self.x1 = x;
        self.y2 = self.y1;
        self.y1 = y;
        y
    }

    /// Clear history — call after seek or when EQ is re-enabled to prevent
    /// stale IIR state from causing an audible click.
    pub fn reset(&mut self) {
        *self = Self::default();
    }
}

// ---------------------------------------------------------------------------
// Filter coefficient calculation
// ---------------------------------------------------------------------------

/// Compute a peaking EQ biquad (bands 1–8).
/// `gain_db` ∈ [−12, +12], `q` = EQ_Q.
pub fn peaking_eq(freq: f32, gain_db: f32, q: f32, sample_rate: f32) -> BiquadCoeffs {
    if gain_db.abs() < 0.001 {
        return BiquadCoeffs::identity();
    }
    let a = 10f32.powf(gain_db / 40.0); // amplitude (not power)
    let w0 = 2.0 * PI * freq / sample_rate;
    let alpha = w0.sin() / (2.0 * q);
    let cos_w0 = w0.cos();

    let b0 = 1.0 + alpha * a;
    let b1 = -2.0 * cos_w0;
    let b2 = 1.0 - alpha * a;
    let a0 = 1.0 + alpha / a;
    let a1 = -2.0 * cos_w0;
    let a2 = 1.0 - alpha / a;

    BiquadCoeffs {
        b0: b0 / a0,
        b1: b1 / a0,
        b2: b2 / a0,
        a1: a1 / a0,
        a2: a2 / a0,
    }
}

/// Compute a low-shelf biquad (band 0, 32 Hz).
/// Uses S=1 shelf slope → alpha = sin(w0)/2 × √2.
pub fn low_shelf(freq: f32, gain_db: f32, sample_rate: f32) -> BiquadCoeffs {
    if gain_db.abs() < 0.001 {
        return BiquadCoeffs::identity();
    }
    let a = 10f32.powf(gain_db / 40.0);
    let w0 = 2.0 * PI * freq / sample_rate;
    let cos_w0 = w0.cos();
    let sin_w0 = w0.sin();
    let alpha = sin_w0 / 2.0 * std::f32::consts::SQRT_2; // S=1
    let sqrt_a = a.sqrt();

    let b0 = a * ((a + 1.0) - (a - 1.0) * cos_w0 + 2.0 * sqrt_a * alpha);
    let b1 = 2.0 * a * ((a - 1.0) - (a + 1.0) * cos_w0);
    let b2 = a * ((a + 1.0) - (a - 1.0) * cos_w0 - 2.0 * sqrt_a * alpha);
    let a0 = (a + 1.0) + (a - 1.0) * cos_w0 + 2.0 * sqrt_a * alpha;
    let a1 = -2.0 * ((a - 1.0) + (a + 1.0) * cos_w0);
    let a2 = (a + 1.0) + (a - 1.0) * cos_w0 - 2.0 * sqrt_a * alpha;

    BiquadCoeffs {
        b0: b0 / a0,
        b1: b1 / a0,
        b2: b2 / a0,
        a1: a1 / a0,
        a2: a2 / a0,
    }
}

/// Compute a high-shelf biquad (band 9, 16 kHz).
/// Uses S=1 shelf slope → alpha = sin(w0)/2 × √2.
pub fn high_shelf(freq: f32, gain_db: f32, sample_rate: f32) -> BiquadCoeffs {
    if gain_db.abs() < 0.001 {
        return BiquadCoeffs::identity();
    }
    let a = 10f32.powf(gain_db / 40.0);
    let w0 = 2.0 * PI * freq / sample_rate;
    let cos_w0 = w0.cos();
    let sin_w0 = w0.sin();
    let alpha = sin_w0 / 2.0 * std::f32::consts::SQRT_2; // S=1
    let sqrt_a = a.sqrt();

    let b0 = a * ((a + 1.0) + (a - 1.0) * cos_w0 + 2.0 * sqrt_a * alpha);
    let b1 = -2.0 * a * ((a - 1.0) + (a + 1.0) * cos_w0);
    let b2 = a * ((a + 1.0) + (a - 1.0) * cos_w0 - 2.0 * sqrt_a * alpha);
    let a0 = (a + 1.0) - (a - 1.0) * cos_w0 + 2.0 * sqrt_a * alpha;
    let a1 = 2.0 * ((a - 1.0) - (a + 1.0) * cos_w0);
    let a2 = (a + 1.0) - (a - 1.0) * cos_w0 - 2.0 * sqrt_a * alpha;

    BiquadCoeffs {
        b0: b0 / a0,
        b1: b1 / a0,
        b2: b2 / a0,
        a1: a1 / a0,
        a2: a2 / a0,
    }
}

/// Compute all 10 band coefficients from a gains array (dB) and a sample rate.
/// Band 0 → low shelf, bands 1–8 → peaking EQ, band 9 → high shelf.
pub fn compute_eq_coeffs(gains_db: &[f32; 10], sample_rate: f32) -> [BiquadCoeffs; 10] {
    [
        low_shelf(EQ_FREQUENCIES[0], gains_db[0], sample_rate),
        peaking_eq(EQ_FREQUENCIES[1], gains_db[1], EQ_Q, sample_rate),
        peaking_eq(EQ_FREQUENCIES[2], gains_db[2], EQ_Q, sample_rate),
        peaking_eq(EQ_FREQUENCIES[3], gains_db[3], EQ_Q, sample_rate),
        peaking_eq(EQ_FREQUENCIES[4], gains_db[4], EQ_Q, sample_rate),
        peaking_eq(EQ_FREQUENCIES[5], gains_db[5], EQ_Q, sample_rate),
        peaking_eq(EQ_FREQUENCIES[6], gains_db[6], EQ_Q, sample_rate),
        peaking_eq(EQ_FREQUENCIES[7], gains_db[7], EQ_Q, sample_rate),
        peaking_eq(EQ_FREQUENCIES[8], gains_db[8], EQ_Q, sample_rate),
        high_shelf(EQ_FREQUENCIES[9], gains_db[9], sample_rate),
    ]
}
