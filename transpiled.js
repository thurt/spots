'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/* global d3 */
// Helpers
var select = function select(prop) {
  return function (obj) {
    return obj[prop];
  };
};
var pipe = function pipe() {
  for (var _len = arguments.length, fns = Array(_len), _key = 0; _key < _len; _key++) {
    fns[_key] = arguments[_key];
  }

  return function (x) {
    return fns.reduce(function (x, fn) {
      return fn(x);
    }, x);
  };
};
var trace = function trace(x) {
  console.log(x);return x;
};

// Models
var Data = {
  _d: [{ location: 'A', itemCount: 25, x: 50, y: 42 }, { location: 'B', itemCount: 0, x: 66, y: 40 }, { location: 'C', itemCount: 40, x: 18, y: 12 }],
  get: function get() {
    return Data._d;
  },
  add: function add(dataObj) {
    Data._d.push(dataObj);
  },
  set: function set(i, dataObj) {
    Data._d[i] = Object.assign(Data._d[i], dataObj);
  }
};
var Svg = {
  instance: d3.select('#svg').append('svg'),
  scale: function scale(_ref) {
    var width = _ref.width,
        height = _ref.height;

    Svg.instance.attr('width', width + 'px').attr('height', height + 'px');
    return { width: width, height: height };
  }
};
var G = {
  instance: Svg.instance.call(d3.zoom().on('zoom', function () {
    G.instance.attr('transform', d3.event.transform);
  })).on('dblclick.zoom', null).append('g'),
  xScale: null,
  yScale: null,
  enterCircles: function enterCircles(r) {
    G.instance.selectAll('circle').data(Data.get(), select('x')).enter().append('circle').on('click', State.selected).on('mouseover', Circle.mouseover).on('mouseout', Circle.mouseout).attr('cx', pipe(select('x'), G.xScale)).attr('cy', pipe(select('y'), G.yScale)).attr('r', 0).transition().attr('r', r);
  },
  _updateCirclePositions: function _updateCirclePositions() {
    G.instance.selectAll('circle').attr('cx', pipe(select('x'), G.xScale)).attr('cy', pipe(select('y'), G.yScale));
  },
  createDataPoint: function createDataPoint() {
    var _d3$mouse = d3.mouse(this),
        _d3$mouse2 = _slicedToArray(_d3$mouse, 2),
        x = _d3$mouse2[0],
        y = _d3$mouse2[1];

    Data.add({ x: G.xScale.invert(x), y: G.yScale.invert(y) });
    G.enterCircles(Circle.r);
  },
  scale: function scale(_ref2) {
    var width = _ref2.width,
        height = _ref2.height;

    G.xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    G.yScale = d3.scaleLinear().domain([0, 100 / (width / height)]).range([0, height]);
    G._updateCirclePositions();
  }
};
var Circle = {
  r: 6,
  largeR: 10,
  mouseover: function mouseover() {
    d3.select(this).transition().attr('r', Circle.largeR);
  },
  mouseout: function mouseout() {
    d3.select(this).transition().attr('r', Circle.r);
  },
  select: function select() {
    d3.select(this).raise().on('mouseout', null).attr('stroke', 'red').transition().attr('r', Circle.largeR).attr('stroke-width', 5);
  },
  unselect: function unselect() {
    d3.select(this).on('mouseout', Circle.mouseout).transition().attr('r', Circle.r).attr('stroke', 'black').attr('stroke-width', 0);
  }
};
var InfoPanel = {
  instance: d3.select('#info-panel'),
  content: d3.select('#info-panel .content'),
  select: function select() {
    var datum = d3.select(this).datum();

    InfoPanel.content.html(Object.keys(datum).map(function (key) {
      return InfoPanel.unmarshal(key, datum[key]);
    }).join(''));
    InfoPanel.instance.attr('class', 'show');
  },
  unselect: function unselect() {
    InfoPanel.instance.attr('class', '');
  },
  unmarshal: function unmarshal(key, val) {
    return '\n      <span>' + key + '</span>: <span>' + val + '</span>\n    ';
  }
};
var Image = {
  instance: G.instance.append('image').attr('xlink:href', 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Whitehouse_MapRoom.svg'),
  scale: function scale(_ref3) {
    var width = _ref3.width,
        height = _ref3.height;

    // http://stackoverflow.com/questions/1373035/how-do-i-scale-one-rectangle-to-the-maximum-size-possible-within-another-rectang
    var bbox = Image.instance.node().getBBox();
    var scale = Math.min(width / bbox.width, height / bbox.height);
    Image.instance.attr('width', bbox.width * scale).attr('height', bbox.height * scale);
    return Image.instance.node().getBBox();
  }
};
var State = {
  current: null,
  selected: function selected() {
    var _this = this;
    // show data for this selection
    InfoPanel.select.call(this);
    // select the circle
    Circle.select.call(this);

    // change g click behavior
    // so clicking outside the circle unselects it
    G.instance.on('click', function () {
      State.unselected.call(_this);
      //prevent parents from responding to this event
      d3.event.stopPropagation();
    });

    G.instance.on('dblclick', null);

    G.instance.selectAll('circle').on('click', function () {
      State.unselected.call(_this);
      State.selected.call(this);
      // prevent parents from responding to this event
      d3.event.stopPropagation();
    });

    // update the current State
    State.current = 'selected';
    console.log(State.current);

    // prevent parents from responding to this event
    d3.event.stopPropagation();
  },
  unselected: function unselected() {
    if (this !== null) {
      Circle.unselect.call(this);
      InfoPanel.unselect();
    }
    G.instance.on('dblclick', G.createDataPoint);
    State.current = 'unselected';
    console.log(State.current);
  }
};
var Application = {
  rescale: pipe(function () {
    return {
      //http://stackoverflow.com/questions/37492158/how-to-convert-pixel-to-translate-value-in-d3
      width: Number.parseFloat(window.innerWidth),
      height: Number.parseFloat(window.innerHeight)
    };
  }, Svg.scale, Image.scale, G.scale)
};

Image.instance.on('load', function () {
  // Procedural processing
  // this works on the initial render, but when i go to translate with mouse it jumps back to 0,0 first.
  // in reality, the G.instance needs to be initialized with a translate built into it
  //G.instance.attr("transform", "translate(" + 200 + "," + 0 + ")");
  Application.rescale();
  G.enterCircles(Circle.r);
  State.unselected.call(null);
  // makes application responsive to window resizes
  window.addEventListener('resize', function () {
    Application.rescale();
  });
});
