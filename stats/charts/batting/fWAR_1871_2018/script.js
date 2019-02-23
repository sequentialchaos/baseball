/////  DIMENSIONS and MARGINS  /////
let fullWidth = 1280,
    fullHeight = 720;

let margin = {top: 80, right: 20, bottom: 80, left: 80},
    width = fullWidth - margin.right - margin.left,
    height = fullHeight - margin.top - margin.bottom;

let chart = d3.select("div#chart");
/////  SVG  ///// 
let svg = d3.select("#chart-grid")
    .attr("width", fullWidth)
    .attr("height", fullHeight)

let g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.style("background-color", "#99CF81");
/////  CANVAS  /////
let canvas = d3.select("#chart-inner")
    .attr("width", width - 1)
    .attr("height", height - 1)
    .style("transform", "translate(" + (margin.left + 1) + "px," + (margin.top + 1) + "px)");

/// Title ///
let title = "MLB seasons with ≥ 5 fWAR";
g.append("text")
    .attr("class", "title")
    .attr("x", width / 2)
    .attr("y", -42)
    .text(title)
    .style("text-anchor", "middle")
    .style("font-family", "Calibri")
    .style("font-weight", "bold")
    .style("font-size", "36px");

// Subtitle //
let subtitle = "All hitters from 1871 to 2018";
g.append("text")
    .attr("class", "subtitle")
    .attr("x", width / 2)
    .attr("y", -21)
    .text(subtitle)
    .style("text-anchor", "middle")
    .style("font-family", "Cambria")
    .style("font-style", "italic")
    .style("font-size", "17px");

/////  RESET BUTTON  /////
let resetButton = chart.append("button")
    .attr("class", "reset")
    .style("position", "absolute")
    .style("top", (margin.top + 20) + "px")
    .style("left", (margin.left + 20) + "px")
    //.style("border", "none")
    .style("text-align", "center")
    .style("font-size", "20px")
    .style("font-family", "Calibri")
    .style("font-weight", "bold")
    .style("color", "white")
    .style("background-color", "#4D514C")
    .style("cursor", "pointer")
    .text("Reset View");

// /////  PLAYER SEARCH  /////
// let searchBox = chart.append("input")
//     .attr("list", "names")
//     .attr("class", "search")
//     .style("position", "absolute")
//     .style("right", (margin.right) + "px")
//     .style("top", (margin.top) + "px");

/////  SCALES - ranges  /////
let x = d3.scaleLinear().range([0, width])
    y = d3.scaleLinear().range([height, 0])

/////  CSV  /////
let csvfile = "fWAR_batters_1871_2018.csv";
d3.csv(csvfile, function(d) {
  return {
    name: d.Name,
    year: +d.Season,
    fwar: +d.WAR,
    PA: +d.PA
  };
}).then(function(data) {
  let dataset = data.filter(d => d.fwar >= 5);
  console.log(dataset);

  /////  SCALES - domains  /////
  let xDomain = d3.extent(dataset, d => d.year);
  let yDomain = d3.extent(dataset, d => d.fwar);
  //let buffer = d => d
  x.domain([xDomain[0] - 1, xDomain[1] + 1]);
  y.domain([yDomain[0] - 0.2, yDomain[1] + 0.2]);

  /////  AXES  /////
  let xAxis = d3.axisBottom(x).ticks(15).tickFormat(d3.format("0")).tickSize(-height);
  let xAxisGroup = g.append("g")
      .attr("class", "axis x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  xAxisGroup.append("text")
      .attr("x", width / 2)
      .attr("y", margin.bottom - 36)
      .attr("dy", "0.30em")
      .style("font-size", 30)
      .style("text-anchor", "middle")
      .style("fill", "black")
      .style("font-weight", "bold")
      .style("letter-spacing", "1px")
      .text("Season");

  let yAxis = d3.axisLeft(y).tickFormat(d3.format("0.1f")).tickSize(-width);
  let yAxisGroup = g.append("g")
      .attr("class", "axis y")
      .call(yAxis);
    
  yAxisGroup.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 26 - margin.left)
      .attr("dy", "0.30em")
      .style("font-size", 30)
      .style("text-anchor", "middle")
      .style("fill", "black")
      .style("font-weight", "bold")
      .style("letter-spacing", "2px")
      .text("fWAR");
  
  d3.selectAll(".tick line")
      .style("opacity", "0.8")

  d3.selectAll(".tick text")
      .style("font-size", 18)
      .style("font-family", "Calibri")
      .style("font-weight", "bold");
  
  /////  ZOOM  /////
  let r = 5, k = [1, 13], pad = 75;
  let rScale = d3.scaleLinear().domain(k).range([r, 2]);
  let tScale = d3.scaleLinear().domain(k).range([18, 15]);
  let zoom = d3.zoom()
      .scaleExtent(k)
      .translateExtent([[-pad, -pad], [width + pad, height + pad]])
      .on("zoom", zoomed);
  
  canvas.call(zoom);

  let context = canvas.node().getContext("2d");

  drawPoints(dataset, r);

  d3.select("button.reset")
      .on("click", resetted);

  function drawPoints(set, r) {
    context.fillStyle = "#DBDCDB";
    context.globalAlpha = 0.6;
    context.fillRect(-pad, -pad, fullWidth + pad, fullHeight + pad);
    context.globalAlpha = 1;
    //context.clearRect(0, 0, fullWidth, fullHeight);
    context.fillStyle = "#464646";
    context.strokeWidth = 1;

    set.forEach(d => {
      drawPoint(d, r);
    })

  }

  function drawPoint(d, r) {
    let cx = x(d.year),
        cy = y(d.fwar);
    
    // Draw Circle
    context.beginPath();
    context.arc(cx, cy, r, 0, 2 * Math.PI); // Circle
    context.closePath();
    context.fill();
    context.stroke();
  }

  function zoomed() {
    // clearTimeout(zoomEndTimeout);
    //draw(randomIndex);
    context.save();
    context.clearRect(0, 0, width, height);
    context.translate(d3.event.transform.x, d3.event.transform.y);
    let tk = d3.event.transform.k
    context.scale(tk, tk);
    console.log(tk);
    let radius = Math.floor(rScale(tk));
    console.log(tScale(tk));
    drawPoints(dataset, radius);
    context.restore();

    xAxisGroup.call(xAxis.scale(d3.event.transform.rescaleX(x)));
    yAxisGroup.call(yAxis.scale(d3.event.transform.rescaleY(y)));

    d3.selectAll(".tick line")
      .style("opacity", "0.15");

    d3.selectAll(".tick text")
      .style("font-size", tScale(tk))
      .style("font-family", "Calibri")
      .style("font-weight", "bold");
  }

  function resetted() {
    canvas.transition()
        .duration(500)
        .call(zoom.transform, d3.zoomIdentity);
  }
})

/* References:
 (1) https://bl.ocks.org/starcalibre/5dc0319ed4f92c4fd9f9
 (2) https://bl.ocks.org/mbostock/3371592
 (3) https://bl.ocks.org/mbostock/d1f7b58631e71fbf9c568345ee04a60e
 (4) https://bl.ocks.org/mbostock/db6b4335bf1662b413e7968910104f0f
*/