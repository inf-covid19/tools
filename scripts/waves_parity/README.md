# Waves parity

`src/utils/waves.ts` is a port of the wave detection in `autocovs-server`. `generate_fixtures.py` runs the Python code to produce what the port must output.

## Setup

Use the versions `autocovs-server` pins:

```bash
python3.9 -m venv /tmp/waves-venv
```

```bash
/tmp/waves-venv/bin/pip install numpy==1.22.4 scipy==1.8.1 pandas==1.4.2
```

## Gate test

`npm test -- src/utils/waves` compares against the committed `src/utils/__fixtures__/waves.json`, offline. To regenerate it:

```bash
/tmp/waves-venv/bin/python scripts/waves_parity/generate_fixtures.py --server ../autocovs-server
```

## Sweep

Every location, four columns, 22 parameter sets, about 50 minutes and 340 MB:

```bash
/tmp/waves-venv/bin/python scripts/waves_parity/generate_fixtures.py --server ../autocovs-server --sweep /tmp/waves-sweep
```

```bash
WAVES_FIXTURE_DIR=/tmp/waves-sweep CI=true npm test -- src/utils/waves --testTimeout=500000
```

The sweep is expected to report a small number of Otsu failures, see below.

## What the comparison measures

The fixtures and the sweep feed Python the same `/records` values the browser gets. That isolates the port, but `/records` is rounded to 10 decimals (`to_json` default) and the old `/featured_periods` smoothed unrounded data. So every number below is against Python running on `/records`, not against the old endpoint.

Accepted as an exception to issue #48: against Python on the raw CSVs, a one-off sample of 39 countries and 6 configs (468 cases) gave 1 moved period boundary, by 1 day, and errors up to about 6e-7 on low-incidence series. Closing this would need full-precision records from the data pipeline.

## Where the port cannot match

The Otsu method picks the largest variance, and real series have plateaus of variances that tie except for the last bits. Those bits come from two places JavaScript cannot reproduce:

- `np.dot` in `otsu_method` uses the BLAS kernel chosen for the CPU. Python disagrees with itself here: forcing `OPENBLAS_CORETYPE=Haswell` changes 13 of 3776 Otsu cases, `Sandybridge` changes 4.
- `savgol_coeffs` solves with LAPACK, so its coefficients carry rounding noise.

The committed fixture can start failing on Otsu if it is regenerated on a different CPU.

Result on 2026-11-02, 20768 cases (236 locations, 4 columns, 22 parameter sets), both differences accepted as exceptions to issue #48:

| Method | Smoothing | Cases computed | Periods differ | Cause |
|---|---|---|---|---|
| linear | any | 16226 | 0 | |
| otsu | moving averages | 2832 | 7 | `np.dot`, the smoothed values are bit-identical |
| otsu | savgol | 902 | 11 | LAPACK rounding in the coefficients |

The 18 differing cases always have the same number of periods. A boundary moved by 1 day in 16 of the 21 moved boundaries, at most by 16 days. Python and the port also raise on the same inputs in every case.

Smoothed values: moving averages are bit-identical. Savgol stays within 1.5e-9 of Python when the error is measured against the larger of the value and 0.1% of the series peak. Measured strictly per value it does not hold next to zero, where Python's own output is rounding noise from cancellation. The test's tolerance is 1e-9, so the sweep can also report a few savgol values just past it.

The sweep run with `np.dot` replaced by a sequential sum leaves only the savgol differences, which is how the two causes were separated.

### Ill-conditioned Savitzky-Golay

Against the exact rational coefficients, scipy 1.8.1 is off by 8e-16 at window 7 / order 2 and 4e-10 at 101/5, but 1e-8 at 201/5, 4e-8 at 31/8, 3e-5 at 31/10, and about 100% at 31/15. Past that point scipy's output is mostly LAPACK rounding, so 1e-9 agreement is not achievable and these configs are not in the fixture. The form still accepts them, and the port then differs from Python, in periods too. Accepted as an exception to issue #48.

The same goes for polyorder = window_length - 1, an identity filter: the values match, but periods can follow the rounding noise.

### Input the port refuses on purpose

- A fractional `window_length` such as 7.5 shows an error, while Python computes a result outside `interp` mode. The form asks for an integer.
- A `window_length` above 10001 shows an error, because allocating it could run the tab out of memory.
