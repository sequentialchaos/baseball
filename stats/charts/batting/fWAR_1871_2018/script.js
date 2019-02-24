/////  DIMENSIONS and MARGINS  /////
let fullWidth = 1200,
    fullHeight = 720;

let margin = {top: 80, right: 20, bottom: 80, left: 80},
    width = fullWidth - margin.right - margin.left,
    height = fullHeight - margin.top - margin.bottom;

/////  MISC GLOBAL VARIABLES  /////    
let selectedPoint;
let isZoomed = false;
let lastEvent;

/////  CHART DIV  /////
let chart = d3.select("div#chart");

/////  SVG  ///// 
let svg = d3.select("#chart-grid")
    .attr("width", fullWidth)
    .attr("height", fullHeight)

let g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

let svgBorderWidth = 5;
svg.style("background-color", "#99CF81")
    //.style("border", svgBorderWidth + "px solid black");
/////  CANVAS  /////
let canvas = d3.select("#chart-inner")
    .attr("width", width - 1)
    .attr("height", height - 1)
    .style("transform", "translate(" + (margin.left + 1) + "px," + (margin.top + 1) + "px)");

/// Title ///
let title = "MLB seasons with ≥ 6 fWAR";
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
let subtitle = "All position players from 1871 to 2018";
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
    .style("border", "3px solid black")
    .style("text-align", "center")
    .style("font-size", "20px")
    .style("font-family", "Calibri")
    .style("font-weight", "bold")
    .style("color", "white")
    .style("background-color", "#4D514C")
    .style("cursor", "pointer")
    .text("Reset View");

/////  TOOLTIP  /////
d3.select(".hidden")
    .attr("class", "hidden")
    .style("display", "none");

let tooltip = {
  w: 310,
  h: 200,
  left: margin.left + width - 310,
  top: margin.top + 1,
  pad: 10,
  bgcolor: "#CBBABA", 
  opacity: 0.95,
  stroke: "black",
  strokeWidth: 20,
  close: {
    w: 40,
    h: 40,
    left: margin.left + width - 40,
  }
}

d3.select("#tooltip")
    .style("position", "absolute")
    .style("left", tooltip.left + "px")
    .style("top", tooltip.top + "px")
    .style("width", tooltip.w + "px")
    .style("height", "auto")//tooltip.h + "px")
    .style("background-color", tooltip.bgcolor)
    .style("opacity", tooltip.opacity)

d3.select("#tooltip").append("div").attr("class", "results");
d3.select("#tooltip").classed("hidden", true);


// /////  PLAYER SEARCH  /////
// let searchBox = chart.append("input")
//     .attr("list", "names")
//     .attr("class", "search")
//     .style("position", "absolute")
//     .style("right", (margin.right) + "px")
//     .style("top", (margin.top) + "px");

/////  SCALES - ranges  /////
let x = d3.scaleLinear().range([0, width])
    y = d3.scaleLinear().range([height, 0]);
let zoomedX = d3.scaleLinear().range([0, width]),
    zoomedY = d3.scaleLinear().range([height, 0]);   


/////  CSV  /////
let csvfile = "fWAR_batters_1871_2018.csv?1";
d3.csv(csvfile, function(d, i) {
  return {
    name: d.Name,
    year: +d.Season,
    fwar: +d.WAR,
    team: d.Team,
    PA: +d.PA,
    id: d.playerid,
    selected: false,
    index: i,
  };
}).then(function(data) {
  let dataset = data.filter(d => d.fwar >= 6);
  let quadTree = d3.quadtree()
      .x(d => d.year)
      .y(d => d.fwar)
      .addAll(dataset);
      
  console.log(dataset);
  console.log(quadTree);
  console.log(quadTree.data());

  /////  SCALES - domains  /////
  let xDomain = d3.extent(dataset, d => d.year),
      yDomain = d3.extent(dataset, d => d.fwar);
  //let buffer = d => d
  x.domain([xDomain[0] - 1, xDomain[1] + 1]);
  zoomedX.domain([xDomain[0] - 1, xDomain[1] + 1]);
  y.domain([yDomain[0] - 0.2, yDomain[1] + 0.2]);
  zoomedY.domain([yDomain[0] - 0.2, yDomain[1] + 0.2]);

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
      .text("Year");

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
      .style("opacity", "0.7")

  d3.selectAll(".tick text")
      .style("font-size", 18)
      .style("font-family", "Calibri")
      .style("font-weight", "bold");
  
  /////  ZOOM  /////
  let r = 5, k = [1, 13], pad = 100, tk = 1;
  let rScale = d3.scaleLinear().domain(k).range([r, 2]),
      zoomedR = 5;//d3.scaleLinear().domain([r, 2]).range([r, 2]);
  let tScale = d3.scaleLinear().domain(k).range([18, 16]);
  let zoom = d3.zoom()
      .scaleExtent(k)
      .translateExtent([[-pad, -pad/2], [width + pad, height + pad / 2]])
      .on("zoom", zoomed);
  
  
  canvas.call(zoom);
  canvas.on("click", onClick);
  let context = canvas.node().getContext("2d");

  drawPoints(dataset, r);

  d3.select("button.reset")
      .on("click", resetted);

  function onClick() {
    let mouse = d3.mouse(this);

    //let newX = d3.scaleLinear().domain()
   // let newY = d3.event.transform.rescaleY(y);
    let xPosition, yPosition;
    console.log(isZoomed)
    if (isZoomed) {
      xPosition = zoomedX.invert(mouse[0]),
      yPosition = zoomedY.invert(mouse[1]);
    } else {
      xPosition = x.invert(mouse[0]),
      yPosition = y.invert(mouse[1]);
    }
    // let xPosition = x.invert(mouse[0]),
    //     yPosition = y.invert(mouse[1]);
    //console.log(mouse[0], xPosition);
    //console.log(mouse[1], yPosition);
    let closest = quadTree.find(xPosition, yPosition);
    
    if (closest != undefined) {
      let dx = zoomedX(closest.year),
          dy = zoomedY(closest.fwar);
      
      console.log(closest.year, closest.fwar, mouse[0], mouse[1], dx, dy);
      let distance = euclideanDistance(mouse[0], mouse[1], dx, dy);
      console.log(distance, zoomedR);
      
      if (distance < zoomedR) {
        if (selectedPoint != undefined) {
          if (selectedPoint == closest) {
            if (selectedPoint.selected) {
              selectedPoint.selected = false;
              d3.select("#tooltip").classed("hidden", true)
            } else {
              
              selectedPoint.selected = true;
              d3.select("#tooltip").classed("hidden", false)
            }
          } else {
            selectedPoint.selected = false;
            //drawPoint(selectedPoint, r);
            selectedPoint = closest;
            selectedPoint.selected = true;
            d3.select("#tooltip").classed("hidden", false)
          }
        } else {
          selectedPoint = closest;
          selectedPoint.selected = true;
          d3.select("#tooltip").classed("hidden", false)
        }
        
        context.save()
        context.scale(tk, tk);
        // r = Math.floor(rScale(tk));
        // drawPoint(dataset[selectedPoint.index], r);
        context.restore();
        d3.selectAll(".results").remove();
        selectedPoints = dataset.filter(d => d.year == selectedPoint.year && d.fwar == selectedPoint.fwar);
        selectedPoints.forEach((d, i) => {
          if (i == 0) {
            d3.select("span#year")
                .text(d.year);
            d3.select("span#fwar")
                .text(d3.format("0.1f")(d.fwar));
            // d3.select("#tooltip").append("div")
            //   .text("Player\tOverall Rank");
          }
          let url = "https://www.fangraphs.com/statss.aspx?playerid=" + d.id;
          d3.select("#tooltip")
            .append("div")
              .attr("class", "results")
              .append("a")
              .attr("href",  url)
              .attr("target", "_blank")
              .text(d.name + ", " + d.team);
          console.log(d);
        })
        d3.select("#tooltip")
            .append("div")
            .attr("class", "results")
      } else {
        if (selectedPoint != undefined) {
          selectedPoint.selected = false;
          d3.select("#tooltip").classed("hidden", true);
        }
      }
    }
    if (lastEvent != null) {
      repeatLastEvent();
    }
    else {
      if (selectedPoint != null) {
        drawPoints(dataset, r);
        // selectedPoint.selected = false;
      }
    }
      
    //console.log(closest);
    //drawPoints(dataset, r);
  }
  
  function drawPoints(set, r) {
    context.fillStyle = "#DBDCDB";
    context.globalAlpha = 0.5;
    context.fillRect(-pad, -pad, fullWidth + pad, fullHeight + pad);
    context.globalAlpha = 1;
    context.fillStyle = "#313131";
    context.strokeWidth = 1;

    set.forEach(d => {
      drawPoint(d, r);
    })

  }

  function drawPoint(d, r) {
    let cx = x(d.year),
        cy = y(d.fwar);
    
    context.save();
    if (d.selected) {
      context.fillStyle = "red"
    } else {
      context.fillStyle = "#313131";
    }
    // Draw Circle
    context.beginPath();
    context.arc(cx, cy, r, 0, 2 * Math.PI); // Circle
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }

  function repeatLastEvent() {
    context.save();
    context.clearRect(0, 0, width, height);
    context.translate(lastEvent.transform.x, lastEvent.transform.y);
   // console.log(d3.event.transform.x, d3.event.transform.y);
    tk = lastEvent.transform.k;
    context.scale(tk, tk);
    // console.log(tk);
    r = Math.floor(rScale(tk));
    zoomedR = rScale(tk) * tk;
    // console.log(tScale(tk));
    drawPoints(dataset, r);
    context.restore();
  }

  function zoomed() {
    isZoomed = true;
    context.save();
    context.clearRect(0, 0, width, height);
    lastEvent = d3.event;
    context.translate(d3.event.transform.x, d3.event.transform.y);
   // console.log(d3.event.transform.x, d3.event.transform.y);
    tk = d3.event.transform.k;
    context.scale(tk, tk);
    // console.log(tk);
    r = Math.floor(rScale(tk));
    zoomedR = rScale(tk) * tk;
    // console.log(tScale(tk));
    drawPoints(dataset, r);
    context.restore();
    zoomedX = d3.event.transform.rescaleX(x);
    zoomedY = d3.event.transform.rescaleY(y);
    xAxisGroup.call(xAxis.scale(zoomedX));
    yAxisGroup.call(yAxis.scale(zoomedY));
    
    d3.selectAll(".tick line")
      .style("opacity", "0.7");

    d3.selectAll(".tick text")
      .style("font-size", tScale(tk))
      .style("font-family", "Calibri")
      .style("font-weight", "bold");
  }

  function euclideanDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
  }

  function resetted() {
    canvas.transition()
        .duration(250)
        .call(zoom.transform, d3.zoomIdentity);
    isZoomed = false;
  }

  let signature = {
    "text": "@SequentialChaos",
    "link": "https://twitter.com/sequentialchaos",
    "size": 18,
    "color": "#063C47"
  }

  svg.append("a")
    .attr("href", signature.link)
    .attr("target", "_blank")
    .append("text")
    .attr("x", width + margin.left + margin.right - 5)
    .attr("y", height + margin.top + margin.bottom - 5)
    .attr("class", "signature")
    .text(signature.text)
    .style("fill", signature.color)
    .style("font-size", signature.size)
    .style("font-weight", "bold")
    .style("text-anchor", "end")
    .style("font-family", "Cambria");

})

/* References:
 (1) https://bl.ocks.org/starcalibre/5dc0319ed4f92c4fd9f9
 (2) https://bl.ocks.org/mbostock/3371592
 (3) https://bl.ocks.org/mbostock/d1f7b58631e71fbf9c568345ee04a60e
 (4) https://bl.ocks.org/mbostock/db6b4335bf1662b413e7968910104f0f
*/