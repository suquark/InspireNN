# InspireNN

This project makes neural networks running on browsers. It can be useful in blogging & presentation.


It reimplements [ConvNetJS](https://github.com/karpathy/convnetjs) with modern styles (ECMAScript6, functional programming), making it's code shorter, more readable for beginners and easier to extend.

It's sure that we should never expect a neural network training in the browser doing a big deal, but it's useful for presentation and understanding.

It is still under developing. 


## Dependency

* transpiler

  `systemjs` + `traceur` is used to load ES6 modules and provide ES6 polyfill for older browsers.

* style

  `jquery`, `materializecss`, `d3js` and `three.js` is included in the project for supporting visualization tasks. Though making use of CDNs may be a better idea, but I prefer to keep them local for offline situations.

## Demo

You may start a http server at root of the project and try some of the demos under `demo/` in your browser.

We will soon provide you with online demos.

### Regression

`demo/regression/` is a demo about regression.

![demo/regression/]()


## License
MIT
