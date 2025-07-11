import 'normalize.css';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {store} from './store';
import App from './App';
import {Provider} from 'jotai';

document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('app');
    const root = createRoot(container);
    root.render(
        <Provider store={store}>
            <App />
        </Provider>,
    );
});
