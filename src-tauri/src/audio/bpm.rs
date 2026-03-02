#![allow(dead_code)]

/// Detect the tempo (BPM) of a mono audio signal using onset-strength autocorrelation.
///
/// Algorithm:
/// 1. Compute RMS energy over 10 ms frames.
/// 2. Half-wave-rectify the first derivative of the RMS envelope → onset strength.
/// 3. Autocorrelate the onset envelope at lags corresponding to 40–220 BPM.
/// 4. Return the BPM derived from the lag with the highest autocorrelation.
///
/// Returns a value in the range [40.0, 220.0] BPM, or `120.0` if detection fails.
pub fn detect(mono_samples: &[f32], sample_rate: u32) -> f32 {
    if mono_samples.is_empty() || sample_rate == 0 {
        return 120.0;
    }

    // 10 ms frame size
    let frame_size = ((sample_rate as usize) * 10 / 1000).max(1);

    // Step 1: RMS energy per frame
    let rms: Vec<f32> = mono_samples
        .chunks(frame_size)
        .map(|chunk| {
            let mean_sq = chunk.iter().map(|&s| s * s).sum::<f32>() / chunk.len() as f32;
            mean_sq.sqrt()
        })
        .collect();

    if rms.len() < 3 {
        return 120.0;
    }

    // Step 2: Onset strength — half-wave-rectified first derivative
    let onset: Vec<f32> = rms.windows(2).map(|w| (w[1] - w[0]).max(0.0)).collect();

    if onset.len() < 2 {
        return 120.0;
    }

    // Frames per second (e.g. 100 fps for 10 ms frames at 44100 Hz)
    let fps = sample_rate as f32 / frame_size as f32;

    // Lag range corresponding to 40–220 BPM
    let lag_min = ((fps * 60.0 / 220.0) as usize).max(1);
    let lag_max = ((fps * 60.0 / 40.0) as usize).min(onset.len() / 2);

    if lag_min >= lag_max {
        return 120.0;
    }

    let n = onset.len();

    // Step 3: Autocorrelation — sum of products at each lag
    let mut best_lag = lag_min;
    let mut best_corr = f32::NEG_INFINITY;

    for lag in lag_min..=lag_max {
        let corr: f32 = (0..(n - lag)).map(|i| onset[i] * onset[i + lag]).sum();
        if corr > best_corr {
            best_corr = corr;
            best_lag = lag;
        }
    }

    // Step 4: Convert lag back to BPM
    (fps * 60.0 / best_lag as f32).clamp(40.0, 220.0)
}
