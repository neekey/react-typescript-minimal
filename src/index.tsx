import '@babel/polyfill';
import React from 'react';
import ReactDom from 'react-dom';
import App from './app/app';

window.addEventListener('DOMContentLoaded', () => {
  ReactDom.render(
    <App />,
    document.querySelector('#root')
  );
});
