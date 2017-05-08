/* global d3 */
// Helpers
const select = prop => obj => obj[prop];
const pipe = (...fns) => x => fns.reduce((x, fn) => fn(x), x);
const trace = x => { console.log(x); return x; };

// Models
const Data = {
  _d: [
    { location: 'A', itemCount: 25, x: 50, y: 42 },
    { location: 'B', itemCount: 0, x: 66, y: 40 },
    { location: 'C', itemCount: 40, x: 18, y: 12 }
  ],
  get: () => {
    return Data._d;
  },
  add: (dataObj) => {
    Data._d.push(dataObj);
  },
  set: (i, dataObj) => {
    Data._d[i] = Object.assign(Data._d[i], dataObj);
  }
};
const Svg = {
  instance: d3.select('#svg')
    .append('svg'),
  scale: function({ width, height }) {
    Svg.instance
      .attr('width', `${width}px`)
      .attr('height', `${height}px`);
    return { width, height };
  }
};
const G = {
  instance:
    Svg.instance.call(d3.zoom().on('zoom', function () {
      G.instance.attr('transform', d3.event.transform)
    }))
      .on('dblclick.zoom', null)
      .append('g'),
  xScale: null,
  yScale: null,
  enterCircles: function(r) {
    G.instance.selectAll('circle')
      .data(Data.get(), select('x'))
      .enter().append('circle')
      .on('click', State.selected)
      .on('mouseover', Circle.mouseover)
      .on('mouseout', Circle.mouseout)
      .attr('cx', pipe(select('x'), G.xScale))
      .attr('cy', pipe(select('y'), G.yScale))
      .attr('r', 0)
      .transition()
      .attr('r', r);
  },
  _updateCirclePositions: function() {
    G.instance.selectAll('circle')
      .attr('cx', pipe(select('x'), G.xScale))
      .attr('cy', pipe(select('y'), G.yScale))
  },
  createDataPoint: function() {
    const [x, y] = d3.mouse(this);
    Data.add({ x: G.xScale.invert(x), y: G.yScale.invert(y) });
    G.enterCircles(Circle.r);
  },
  scale: function({ width, height }) {
    G.xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    G.yScale = d3.scaleLinear().domain([0, 100/(width/height)]).range([0, height]);
    G._updateCirclePositions();
  }
};
const Circle = {
  r: 6,
  largeR: 10,
  mouseover: function() {
    d3.select(this)
      .transition()
      .attr('r', Circle.largeR);
  },
  mouseout: function() {
    d3.select(this)
      .transition()
      .attr('r', Circle.r);
  },
  select: function() {
    d3.select(this)
      .raise()
      .on('mouseout', null)
      .attr('stroke', 'red')
      .transition()
      .attr('r', Circle.largeR).attr('stroke-width', 5);
  },
  unselect: function() {
    d3.select(this)
      .on('mouseout', Circle.mouseout)
      .transition()
      .attr('r', Circle.r).attr('stroke', 'black').attr('stroke-width', 0);
  }
};
const InfoPanel = {
  instance: d3.select('#info-panel'),
  content: d3.select('#info-panel .content'),
  select: function() {
    const datum = d3.select(this).datum();

    InfoPanel.content.html(
      Object.keys(datum)
        .map(key => InfoPanel.unmarshal(key, datum[key]))
        .join('')
    );
    InfoPanel.instance.attr('class', 'show');
  },
  unselect: function() {
    InfoPanel.instance.attr('class', '');
  },
  unmarshal: function(key, val) {
    return `
      <span>${key}</span>: <span>${val}</span>
    `;
  }
};
const Image = {
  instance: G.instance
    .append('image')
    .attr('xlink:href', 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Whitehouse_MapRoom.svg'),
  scale: function({ width, height }) {
    // http://stackoverflow.com/questions/1373035/how-do-i-scale-one-rectangle-to-the-maximum-size-possible-within-another-rectang
    const bbox = Image.instance.node().getBBox();
    const scale = Math.min(width/bbox.width, height/bbox.height);
    Image.instance.attr('width', bbox.width * scale).attr('height', bbox.height * scale);
    return Image.instance.node().getBBox();
  }
};
const State = {
  current: null,
  selected: function() {
    const _this = this;
    // show data for this selection
    InfoPanel.select.call(this);
    // select the circle
    Circle.select.call(this);

    // change g click behavior
    // so clicking outside the circle unselects it
    G.instance.on('click', function() {
      State.unselected.call(_this);
      //prevent parents from responding to this event
      d3.event.stopPropagation();
    });

    G.instance.on('dblclick', null);

    G.instance.selectAll('circle')
      .on('click', function() {
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
  unselected: function() {
    if (this !== null) {
      Circle.unselect.call(this);
      InfoPanel.unselect();
    }
    G.instance.on('dblclick', G.createDataPoint);
    State.current = 'unselected';
    console.log(State.current);
  }
};
const Application = {
  rescale: pipe(() => ({
    //http://stackoverflow.com/questions/37492158/how-to-convert-pixel-to-translate-value-in-d3
    width: Number.parseFloat(window.innerWidth),
    height: Number.parseFloat(window.innerHeight)
  }), Svg.scale, Image.scale, G.scale)
};

Image.instance.on('load', function() {
  // Procedural processing
// this works on the initial render, but when i go to translate with mouse it jumps back to 0,0 first.
// in reality, the G.instance needs to be initialized with a translate built into it
//G.instance.attr("transform", "translate(" + 200 + "," + 0 + ")");
  Application.rescale();
  G.enterCircles(Circle.r);
  State.unselected.call(null);
  // makes application responsive to window resizes
  window.addEventListener('resize', function() { Application.rescale() });
});
