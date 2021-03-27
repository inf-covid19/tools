from numpy.core.numeric import identity
from numpy.lib.index_tricks import _fill_diagonal_dispatcher
import pandas as pd
import numpy as np
import json
import math

input_data = {}
output = {}


with open('/home/chicobentojr/Workspace/UFRGS/inf-covid19/tools/server/input.json') as f:
    input_data = json.load(f)


# print(json.dumps(input, indent=2))

def reduce_to_train_data(data, metric):
    # return slice.reduce(
    #           (acc: { X: any; Y: any }, row: { cases: any; deaths: any }, index: any) => ({
    #             X: [...acc.X, index],
    #             Y: [...acc.Y, metric === "cases" ? row.cases : row.deaths],
    #           }),
    #           { X: [], Y: [] }
    #         );
    X, Y = [], []

    for i, d in enumerate(data):
        X.append(i)
        Y.append(d[metric])

    return X, Y


def get_best_model(data, index, threshold, metric):
    # const testData = reduceToTrainData(dataSinceFirstCase.slice(sliceIndex - threshold, sliceIndex)).Y;
    _, test_Y = reduce_to_train_data(data[index-threshold:index], metric)

    regressors = []

    # const regressors = [...Array(sliceIndex)].flatMap((_, index: number) => {
    #     const { X, Y } = reduceToTrainData(dataSinceFirstCase.slice(index, sliceIndex - threshold));
    for i in range(index):
        X, Y = reduce_to_train_data(data[i:index - threshold], metric)
        errors = []

        try:
            for v in [2]:
                degree = v if len(X) > 2 else 1

                regressor = np.poly1d(np.polyfit(X, Y, degree))

                for idx, real_value in enumerate(test_Y):
                    pred_value = math.floor(regressor(len(Y) + idx) + 0.5)

                    errors.append(math.pow(real_value - pred_value, 2))

            regressors.append({
                'regressor': regressor,
                'mse': np.mean(errors),
                'X': X,
                'Y': Y
            })
        except:
            pass

    mse_errors = list(map(lambda x: x['mse'], regressors))
    min_error_index = np.argmin(mse_errors)

    return regressors[min_error_index]


def get_serie_data(raw_data, threshold, base_index=30, metric="cases"):

    new_data = []

    data = raw_data[base_index:]

    for i, row in enumerate(data):
        # const bestModel = getBestModel(BASE_INDEX + index, threshold)
        print(
            f"Trying search serie data with {i}/{len(data)} and threshold = {threshold}")
        best_model = get_best_model(
            raw_data, base_index + i, threshold, metric)

        print("best model", best_model['mse'])

        # if (!bestModel) return []

        # const predFn = (n: number) = > Math.round(bestModel.regressor.predict(n))

        def pred_fn(n):
            return math.floor(best_model['regressor'](n) + 0.5)

        # const fActual = last(bestModel.Y)! as number
        # const fPrediction = predFn(bestModel.X.length - 1)
        # const predDiff = fActual - fPrediction
        f_actual = best_model['Y'][-1]
        f_prediction = pred_fn(len(best_model['X']) - 1)
        pred_diff = f_actual - f_prediction

        # const predIndex = bestModel.X.length + threshold
        # const predValue = predFn(predIndex) + predDiff
        pred_index = len(best_model['X']) + threshold
        pred_value = pred_fn(pred_index) + pred_diff

        # const rawValue = dataSinceFirstCase[BASE_INDEX + index][metric]
        # const errorFromRaw = (predValue - rawValue) / predValue
        raw_value = raw_data[base_index + i][metric]
        error_from_raw = (pred_value - raw_value) / pred_value

        new_data.append({
            'x': row['date'],
            'y': error_from_raw * 100,
            'is_prediction': True,
            'raw_value': raw_value,
            'pred_value': pred_value,
            'raw_error': pred_value - raw_value,
        })

    return new_data[-base_index:]

    # const mseErrors = regressors.map((r) => r.mse);
    # const minErrorIndex = mseErrors.indexOf(Math.min(...mseErrors));
    # return regressors[minErrorIndex];
# data = input['data'][-90:]
# data = input['data']
data = input_data

# print("Data")
# print(data)
# print()


result_1d = get_serie_data(data, 1, metric="deaths")

print("Result 1d")
print(json.dumps(result_1d))

# print("best model")
# print(get_best_model(data, 30 + 1, 1, "deaths"))
