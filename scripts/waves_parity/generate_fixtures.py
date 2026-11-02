#!/usr/bin/env python3
"""Runs the autocovs-server wave code to produce the expected output for src/utils/waves.ts.

Needs the versions pinned by autocovs-server: numpy==1.22.4 scipy==1.8.1 pandas==1.4.2 (Python 3.9).

    python generate_fixtures.py --server ../autocovs-server
        rewrites src/utils/__fixtures__/waves.json, the sample the gate test runs.
    python generate_fixtures.py --server ../autocovs-server --sweep DIR
        writes one file per location to DIR, for every location in /metadata.
        Check them with: WAVES_FIXTURE_DIR=DIR CI=true npm test -- src/utils/waves
"""
import argparse
import json
import logging
import math
import os
import sys
import types
import urllib.request

API = 'https://autocovs-api.felipemfp.dev'
FIXTURE = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'utils', '__fixtures__', 'waves.json')
COLUMNS = ['confirmed_by_100k_daily_7d', 'deaths_by_100k_daily_7d', 'confirmed_daily_21d', 'deaths_daily_21d']

SAMPLE_LOCATIONS = ['United States', 'Brazil', 'Saint Lucia', 'Iceland']

# Its Otsu thresholds only match with numpy's exact summation order.
SUM_ORDER_LOCATION = '8166c743'

PRODUCTION = dict(method='otsu', smooth_fn='savgol_filter', smooth_params=dict(polyorder=2, window_length=7))

# The parameter sets the UI can send.
CONFIGS = [
    PRODUCTION,
    dict(method='linear', smooth_fn='savgol_filter', smooth_params=dict(polyorder=2, window_length=7)),
    dict(),
    dict(method='otsu'),
    dict(smooth_params=dict(window=14, min_periods=3)),
    dict(smooth_params=dict(window=21, closed='both')),
    dict(smooth_params=dict(window=7, closed='left')),
    dict(smooth_params=dict(window=7, closed='neither')),
    dict(method='otsu', smooth_params=dict(window=30, min_periods=30)),
    dict(smooth_fn='exponential_moving_average'),
    dict(method='otsu', smooth_fn='exponential_moving_average', smooth_params=dict(alpha=0.35, min_periods=5)),
    dict(smooth_fn='savgol_filter', smooth_params=dict(window_length=31, polyorder=5)),
    dict(smooth_fn='savgol_filter', smooth_params=dict(window_length=7, polyorder=2, mode='mirror')),
    dict(smooth_fn='savgol_filter', smooth_params=dict(window_length=9, polyorder=3, mode='nearest')),
    dict(smooth_fn='savgol_filter', smooth_params=dict(window_length=11, polyorder=2, mode='wrap')),
    dict(smooth_fn='savgol_filter', smooth_params=dict(window_length=7, polyorder=2, mode='constant', cval=3.5)),
    dict(smooth_fn='savgol_filter', smooth_params=dict(window_length=8, polyorder=2)),
    dict(smooth_fn='savgol_filter', smooth_params=dict(window_length=21, polyorder=7, mode='mirror')),
    dict(smooth_fn='exponential_moving_average', smooth_params=dict(min_periods=1.5)),
    dict(smooth_fn='exponential_moving_average', smooth_params=dict(min_periods=-1)),
    dict(sign_window=3, ascend_window=7, descent_window=3, plateau_window=10, period_min_days=30, restart_min_days=14),
    dict(sign_window=1, ascend_window=1, descent_window=1, plateau_window=1, period_min_days=0, restart_min_days=0),
]

# Every one of these makes the Python code raise.
ERROR_CONFIGS = [
    dict(smooth_fn='savgol_filter', smooth_params=dict(window_length=7, polyorder=7)),
    dict(smooth_fn='savgol_filter', smooth_params=dict(window_length=7, polyorder=2, mode='bogus')),
    dict(smooth_fn='exponential_moving_average', smooth_params=dict(alpha=1.5)),
    dict(smooth_params=dict(window=3, min_periods=4)),
    dict(smooth_params=dict(window=7, closed='nope')),
    dict(smooth_fn='no_such_function'),
]


def day(n):
    return 1584144000000 + n * 86400000


def synthetic_locations():
    wave = [1 + 100 * math.exp(-((i - 60) / 15) ** 2) + 80 * math.exp(-((i - 200) / 25) ** 2) for i in range(320)]
    series = {
        # Under 37 points, where L is 0 and modified_TSMO raises internally.
        'short': [1.0, 2.0, 4.0, 8.0, 16.0, 8.0, 4.0, 2.0],
        'single': [5.0],
        # Only filtered-out values, so the frame is empty.
        'empty': [0.0, None, 0.0],
        'gaps': [None if i % 11 == 0 else 0.0 if i % 17 == 0 else v for i, v in enumerate(wave)],
        'flat': [7.0] * 120,
        # Every bin has the same sum, but float32 accumulation in otsu.py makes it depend on the order.
        'float32_ties': [3e7 if i % 10 == (0 if (i // 10) % 3 == 1 else 9) else 1.0 for i in range(370)],
        'two_waves': wave,
        # The rounding step in get_featured_periods_alt depends on the magnitude.
        'huge': [v * 1e6 for v in wave],
        'tiny': [v * 1e-6 for v in wave],
    }
    return {name: dict(dates=[day(i) for i in range(len(v))], columns=dict(value=v)) for name, v in series.items()}


def get(path):
    request = urllib.request.Request(API + path, headers={'User-Agent': 'Autocovs/1.0'})
    with urllib.request.urlopen(request, timeout=120) as response:
        return json.load(response)


def load_server(path):
    # otsu.py imports matplotlib without using it.
    sys.modules.setdefault('matplotlib', types.ModuleType('matplotlib'))
    sys.modules.setdefault('matplotlib.pyplot', types.ModuleType('matplotlib.pyplot'))
    sys.path.insert(0, path)
    from app import helpers
    return helpers


def clean(value):
    return None if value is None or math.isnan(value) else value


def run_case(helpers, pd, location, column, config):
    """The body of GET /featured_periods in autocovs-server app/main.py, minus the download."""
    df = pd.DataFrame({
        'date': pd.to_datetime(location['dates'], unit='ms'),
        column: pd.to_numeric(pd.Series(location['columns'][column], dtype=object), errors='coerce'),
    })
    method = config.get('method', 'linear')
    linear = {k: config[k] for k in ('sign_window', 'ascend_window', 'descent_window', 'plateau_window',
                                     'period_min_days', 'restart_min_days') if k in config}
    df = df[df[column] > 0].copy()
    effective = f'{column}_smoothed'
    try:
        df[effective] = helpers.smooth_series(df, column, config.get('smooth_fn', 'simple_moving_average'),
                                              config.get('smooth_params', {}))
        records = df[['date', effective]]
        indexed = records.set_index('date')
        fn = helpers.get_featured_periods_otsu if method == 'otsu' else helpers.get_featured_periods_alt
        periods = fn(indexed, col=effective, **linear)
    except Exception as error:
        return dict(error=type(error).__name__)
    return dict(
        featured_periods=json.loads(periods.to_json(orient='records')),
        smoothed=[clean(float(x)) for x in records[effective]],
    )


def build(helpers, pd, location, columns, configs):
    return [
        dict(column=column, config=config, expected=run_case(helpers, pd, location, column, config))
        for column in columns for config in configs
    ]


def dump(path, payload):
    with open(path, 'w') as f:
        json.dump(payload, f, separators=(',', ':'), allow_nan=False)


def records_to_location(records):
    return dict(dates=[r['date'] for r in records], columns={c: [r.get(c) for r in records] for c in COLUMNS})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--server', required=True, help='path to an autocovs-server checkout')
    parser.add_argument('--sweep', help='write every location to this directory')
    args = parser.parse_args()

    helpers = load_server(args.server)
    # get_featured_periods_otsu logs a traceback for every series it cannot threshold.
    logging.disable(logging.ERROR)
    import numpy
    import pandas as pd
    import scipy
    versions = dict(numpy=numpy.__version__, scipy=scipy.__version__, pandas=pd.__version__)

    metadata = get('/metadata')
    if args.sweep:
        os.makedirs(args.sweep, exist_ok=True)
        for entry in metadata:
            location = records_to_location(get(f"/records/{entry['id']}"))
            cases = build(helpers, pd, location, COLUMNS, CONFIGS)
            dump(os.path.join(args.sweep, f"{entry['id']}.json"), dict(
                versions=versions, locations={entry['id']: dict(location, cases=cases)}))
            print(entry['id'], entry['administrative_area_level_1'], flush=True)
        return

    locations = synthetic_locations()
    for location in locations.values():
        location['cases'] = build(helpers, pd, location, ['value'], CONFIGS + ERROR_CONFIGS)
    # Any real smoothing would average away the order the series depends on.
    locations['float32_ties']['cases'] += build(helpers, pd, locations['float32_ties'], ['value'],
                                                [dict(method='otsu', smooth_params=dict(window=1))])

    by_name = {m['administrative_area_level_1']: m['id'] for m in metadata if m['administrative_area_level'] == 1}
    samples = [(name, by_name[name], COLUMNS[i % len(COLUMNS)]) for i, name in enumerate(SAMPLE_LOCATIONS)]
    samples.append((SUM_ORDER_LOCATION, SUM_ORDER_LOCATION, 'deaths_daily_21d'))
    for name, location_id, column in samples:
        location = records_to_location(get(f'/records/{location_id}'))
        # One column per location keeps the committed file small; the sweep covers the rest.
        location['columns'] = {column: location['columns'][column]}
        location['cases'] = build(helpers, pd, location, [column], CONFIGS)
        locations[name] = location

    os.makedirs(os.path.dirname(FIXTURE), exist_ok=True)
    dump(FIXTURE, dict(versions=versions, locations=locations))


if __name__ == '__main__':
    main()
