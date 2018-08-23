/**
  * Application sagas to trigger side effects in repsonse to actions
  *
  * @ignore
  */
// vendor
import { call, takeEvery, select, put } from 'redux-saga/effects';
import { route, getHash, getHashParameters } from 'react-hash-route';
import { csvParse } from 'd3-dsv';
import 'whatwg-fetch';
import fetchJsonp from 'fetch-jsonp';
import extend from 'lodash/extend';
// utils
import { queryObject, queryString, routeString } from 'utils/queries';
// app constants, selectors, actions
import { NAVIGATE, LOAD_DATA } from './constants';
import { selectRequestedAt } from './selectors';
import { dataRequested, loadError, dataLoaded, navigationOccured } from './actions';

const MAX_LOAD_ATTEMPTS = 5;

/**
 * Navigate Saga:
 * - Composes to new route string for location
 * - Calls router
 * - Also makes sure page is scrolled to top on hash change
 *
 * @param {object} payload location: the new location, args: query arguments
 */
function* navigateSaga({ location, args }) {
  // get route hash
  const hash = yield getHash();
  // get query from route params
  const params = yield queryObject(getHashParameters());

  // default args
  const xArgs = extend({
    remove: true,
  }, args || {});

  // update path: replace or keep if not provided
  let path = '';
  if (typeof location === 'string') {
    path = location;
  } else if (typeof location.path !== 'undefined') {
    path = location.path;
  } else {
    path = hash;
  }

  // update search query
  let query = '';
  if (location.query) {
    query = queryString(xArgs.remove
      // remove: ignore all previous params and only use new params
      ? location.query
      // keep: merge previous and new params
      : extend(params, location.query)
    );
  }
  // combine path and query if present
  yield call(route, routeString(path, query));
  yield put(navigationOccured(path, query));
  if (path !== hash) {
    yield call(window.scrollTo, 0, 0);
  }
}

// Pass in our generator we want to restart, and some function
// to handle potential errors thrown within said generator.
// following https://codeburst.io/try-again-more-redux-saga-patterns-bfbc3ffcdc
const autoRestart = (generator, handleError, maxTries = MAX_LOAD_ATTEMPTS) =>
  function* autoRestarting(...args) {
    let n = 0;
    while (n < maxTries) {
      n += 1;
      try {
        yield call(generator, ...args);
        break;
      } catch (err) {
        if (n >= maxTries) {
          yield handleError(err, ...args);
        }
      }
    }
  };


/**
 * Load data saga:
 * - Load data from API or files
 * - Dispatch load event with loaded data
 *
 * @param {object} payload key: data set key, value: data set definition
 */
const loadDataSaga = autoRestart(
  function* loadData({ key, value }) {
    // check if already loading
    const requestedAt = yield select(selectRequestedAt, key);
    if (!requestedAt) {
      try {
        // First record that we are requesting
        yield put(dataRequested(key, Date.now()));
        // load from JSON file
        if (value.source === 'json') {
          // fetch json file
          const path = `${value.path}${value.filename}`;
          const response = yield fetch(
            window.global.OGDD_JS_PATH
            ? `${window.global.OGDD_JS_PATH}${path}`
            : path
          );
          const responseBody = yield response.json();
          if (responseBody) {
            yield put(dataLoaded(key, responseBody));
          }
        }
        // load from API
        if (value.source === 'api') {
          // fetch data from data.govt api (CKAN, see http://docs.ckan.org/en/latest/maintaining/datastore.html#api-reference)
          // limit parameter defaults to 100, setting high number to practically turn limits off - after 10 years we should not have more than 1000 rows
          const path = `${value.path}?resource_id=${value.resourceId}&limit=999999`;
          const response = yield fetchJsonp(path);
          const responseBody = yield response.json();
          if (responseBody) {
            yield put(dataLoaded(key, responseBody.result.records));
          }
        }
        // load from CSV file
        if (value.source === 'csv') {
          const path = `${value.path}${value.filename}`;
          const response = yield fetch(
            window.global.OGDD_JS_PATH
            ? `${window.global.OGDD_JS_PATH}${path}`
            : path
          );
          const responseBody = yield response.text();
          if (responseBody) {
            yield put(dataLoaded(key, csvParse(responseBody)));
          }
        }
      } catch (err) {
        // // Clear the request time on error, and try again
        yield put(dataRequested(key, null));
        throw new Error(err);
      }
    }
  },
  function* handleError(err, { key }) {
    // Whoops Save error after max attampets
    yield put(loadError(key, err));
  },
  MAX_LOAD_ATTEMPTS,
);

/**
 * Root saga manages watcher lifecycle
 * @return {void}
 */
export default function* rootSaga() {
  yield takeEvery(NAVIGATE, navigateSaga);
  yield takeEvery(LOAD_DATA, loadDataSaga);
}
