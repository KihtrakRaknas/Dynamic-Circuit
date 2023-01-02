# Dynamic Circuit

## Demo

Visit this site for a demo and usage instructions: [https://dynamiccircuit.kihtrak.com/](https://dynamiccircuit.kihtrak.com/)

## Usage

Create a canvas
```html
<canvas id="background-canvas"></canvas>
```

Call `init()` with the canvas:

```js
const canvas = document.getElementById("background-canvas");
init(canvas);
```

You can optionally include a properties object to further customize the behavior of the background.

```js
const properties = {
    "debugGrid": false,
    "gridBoxSize": 20,
    "circleDiameter": 10,
    "initialNumberOfLines": 10,
    "linesPerSecond": 5,
    "maxAttempts": 10,
    "strokeWidth": 2,
    "lengthPerSecond": 100,
    "backgroundColor": {"r": 255, "g": 255, "b": 255},
    "color": {"r": 100, "g": 100, "b": 100},
    "shrink": 2,
    "offscreenCalculationBoxes": 5,
    "parent": document.getElementsByTagName("html")[0]
}
init(canvas, properties);
```