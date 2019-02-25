/////  DIMENSIONS and MARGINS  /////
let fullWidth = 1320,
    fullHeight = 800;

let margin = {top: 80, right: 20, bottom: 80, left: 80},
    width = fullWidth - margin.right - margin.left,
    height = fullHeight - margin.top - margin.bottom;

/////  MISC GLOBAL VARIABLES  /////    
let selectedPoint;
let isZoomed = false;
let lastEvent;
let prev_seasons;

/////  CHART DIV  /////
let chart = d3.select("div#chart");

/////  SVG  ///// 
let svg = d3.select("#chart-grid")
    .attr("width", fullWidth)
    .attr("height", fullHeight)

let g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

let svgBorderWidth = 5;
svg.style("background-color", "#88B873")
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
    .style("font-size", "40px");

// Subtitle //
let subtitle = "All position players from 1871 to 2018";
g.append("text")
    .attr("class", "subtitle")
    .attr("x", width / 2)
    .attr("y", -18)
    .text(subtitle)
    .style("text-anchor", "middle")
    .style("font-family", "Cambria")
    .style("font-style", "italic")
    .style("font-size", "18px");

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
    .style("padding", "4px")
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




/////  SCALES - ranges  /////
let x = d3.scaleLinear().range([0, width])
    y = d3.scaleLinear().range([height, 0]);
let zoomedX = d3.scaleLinear().range([0, width]),
    zoomedY = d3.scaleLinear().range([height, 0]);   


/////  CSV  /////
let csvfile = "fWAR_batters_1871_to_2018.csv";
d3.csv(csvfile, function(d, i) {
  return {
    name: d.Name,
    year: +d.Season,
    fwar: +d.WAR,
    team: d.Team,
    PA: +d.PA,
    id: d.playerid,
    selected: false,
    currentPlayer: false,
    index: i,
  };
}).then(function(data) {
  let dataset = data.filter(d => d.fwar >= 6);
  console.log(dataset);
  // let ids = dataset.map(d => d.id);
  // let unique_ids = ids.filter((d, i) => ids.indexOf(d) == i);

  let quadTree = d3.quadtree()
      .x(d => d.year)
      .y(d => d.fwar)
      .addAll(dataset);
      


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
      .style("letter-spacing", "0.5px")
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
      .style("font-size", 19)
      .style("font-family", "Calibri")
      .style("font-weight", "bold");
  
  /////  ZOOM  /////
  let r = 5, k = [1, 13], pad = 100, tk = 1;
  let rScale = d3.scaleLinear().domain(k).range([r, 2]),
      zoomedR = 5;
  let tScale = d3.scaleLinear().domain(k).range([19, 17]);
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

    let xPosition, yPosition;
    if (isZoomed) {
      xPosition = zoomedX.invert(mouse[0]),
      yPosition = zoomedY.invert(mouse[1]);
    } else {
      xPosition = x.invert(mouse[0]),
      yPosition = y.invert(mouse[1]);
    }

    let closest = quadTree.find(xPosition, yPosition);
    if (closest != undefined) {
      let dx = zoomedX(closest.year),
          dy = zoomedY(closest.fwar);
      
      let distance = euclideanDistance(mouse[0], mouse[1], dx, dy);
      
      if (distance < zoomedR) {
        if (selectedPoint != undefined) {
          if (selectedPoint == closest) {
            if (selectedPoint.selected) {
              selectedPoint.selected = false;
              drawPoint(selectedPoint, r);
              d3.select("#tooltip").classed("hidden", true)
            } else {
              selectedPoint.selected = true;
              drawPoint(selectedPoint, r);
              d3.select("#tooltip").classed("hidden", false)
            }
          } else {
            selectedPoint.selected = false;
            drawPoint(selectedPoint, r);
            selectedPoint = closest;
            selectedPoint.selected = true;
            drawPoint(selectedPoint, r);
            d3.select("#tooltip").classed("hidden", false)
          }
        } else {
          selectedPoint = closest;
          selectedPoint.selected = true;
          drawPoint(selectedPoint, r);
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
          let year_url = "https://www.fangraphs.com/leaders.aspx?pos=all&stats=bat&lg=all&qual=0&type=8&season=" + d.year + "&month=&season1=&ind=&team=&rost=&age=&filter=&players=";
          if (i == 0) {
            d3.select("a#year")
                .attr("href", year_url)
                .attr("target", "_blank")
                .text(d.year)
                .style("", "underlined");
            d3.select("span#fwar")
                .text(d3.format("0.1f")(d.fwar));
            // d3.select("#tooltip").append("div")
            //   .text("Player\tOverall Rank");
          }
          let player_url = "https://www.fangraphs.com/statss.aspx?playerid=" + d.id;
          d3.select("#tooltip")
            .append("div")
              .attr("class", "results")
              .append("a")
              .attr("href",  player_url)
              .attr("target", "_blank")
              .text(d.name + ", " + d.team);
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
        // selectedPoint.selected = false;
        drawPoint(selectedPoint, r);
        // drawPoints(dataset, r);
        
      }
    }
  }
  function setCanvasBackground() {
    context.save();
    context.fillStyle = "#DBDCDB";
    context.globalAlpha = 0.5;
    context.fillRect(-pad, -pad, fullWidth + pad, fullHeight + pad);
    context.restore();
  }

  function drawPoints(set, r) {
    setCanvasBackground();
    context.save();
    context.fillStyle = "#313131";
    context.strokeWidth = 1;

    set.forEach(d => {
      drawPoint(d, r);
    })
    context.restore();
  }

  function drawPoint(d, r) {
    let overlaps = dataset.filter(e => e.year == d.year && e.fwar == d.fwar).length - 1;
    let cx = x(d.year),
        cy = y(d.fwar);
    
    context.save();
    if (d.selected) {
      context.fillStyle = "#15B094"
    } else if (d.currentPlayer) {
      context.fillStyle = "#CE1515";
    } else {
      context.fillStyle = "#313131";
    }
    // Draw Circle
    context.beginPath();
    context.arc(cx, cy, r + overlaps, 0, 2 * Math.PI); // Circle
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }
  console.log(dataset.filter(d => d.PA <= 400))
  function highlightPlayer(name) {
    let seasons = dataset.filter(d => name == d.name);
    let other_seasons = [];
    for (let i = 0; i < seasons.length; i++) {
      let others = dataset.filter(d => seasons[i].year == d.year 
                                    && seasons[i].fwar == d.fwar 
                                    && seasons[i].name != d.name);
      for (let j = 0; j < others.length; j++) {
        others[j].currentPlayer = true;
        other_seasons.push(others[j])
      }
      seasons[i].currentPlayer = true;
    }
    console.log(other_seasons)
    for (let other of other_seasons) {
      seasons.push(other);
    }
    console.log(seasons)
    drawPoints(seasons, r);
    if (prev_seasons != null) {
      for (let j = 0; j < prev_seasons.length; j++) {
        prev_seasons[j].currentPlayer = false;
      }
      console.log(prev_seasons)
      drawPoints(prev_seasons)
    }
    prev_seasons = [];
    for (let season of seasons) {
      prev_seasons.push(season);
    }
    resetted();
  }

  function repeatLastEvent() {
    context.save();
    context.clearRect(0, 0, width, height);
    context.translate(lastEvent.transform.x, lastEvent.transform.y);
    tk = lastEvent.transform.k;
    context.scale(tk, tk);
    r = Math.floor(rScale(tk));
    zoomedR = rScale(tk) * tk;
    drawPoints(dataset, r);
    context.restore();
  }

  function zoomed() {
    isZoomed = true;
    context.save();
    context.clearRect(0, 0, width, height);
    lastEvent = d3.event;
    context.translate(d3.event.transform.x, d3.event.transform.y);
    tk = d3.event.transform.k;
    context.scale(tk, tk);
    r = Math.floor(rScale(tk));
    zoomedR = rScale(tk) * tk;
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
  /////  PLAYER SEARCH  /////
  let searchBox = d3.select("input.search")
    .attr("placeholder", "Find player")
    .style("position", "absolute")
    .style("left", (margin.left + width - 185 - 3) + "px")
    .style("top", (margin.top - 30) + "px")
    .style("width", "185px")
    .style("font-size", "20px")
    .style("font-family", "Palatino")

  let names = dataset.map(d => d.name);
  unique_names = names.filter((d, i) => i == names.indexOf(d));
  console.log(unique_names);
  d3.select("datalist#names")
    .selectAll("option")
    .data(unique_names)
    .enter()
    .append("option")
    .attr("value", d => d);

  searchBox.on("change", function() {
    let name = d3.select("input.search").property("value");
    highlightPlayer(name);
  })
  // Sources
  let source = {
    "label": "data: ",
    "text": "www.fangraphs.com",
    "size": 20,
    "link": "https://www.fangraphs.com/leaders.aspx?pos=all&stats=bat&lg=all&qual=300&type=8&season=2018&month=0&season1=1871&ind=1&team=&rost=&age=&filter=&players=",
    "font_family": "Calibri",
    "color": "#21480F"
  }

  g.append("a")
      .attr("href", source.link)
      .attr("target", "_blank")
      .append("text")
      .attr("x", -margin.left + 55)
      .attr("y", height + margin.bottom - 7)
      .attr("class", "source")
    .text(source.text)
      .style("font-size", source.size)
      .style("text-anchor", "start")
      .style("font-family", source.font_family)
      .style("font-style", "italic")
      .style("fill", source.color)
      .style("text-shadow", "1px 0 0 #000, 0 -1px 0 #000, 0 1px 0 #000, -1px 0 0 #000;");

  g.append("text")
      .attr("x", -margin.left + 5)
      .attr("y", height + margin.bottom - 7)
      .attr("class", "source")
      .text(source.label)
      .style("font-size", source.size)
      .style("font-weight", "bold")
      .style("text-anchor", "start")
      .style("font-family", source.font_family)

  g.append("a")
      .attr("href", "https://library.fangraphs.com/war/war-position-players/")
      .attr("target", "_blank")
    .append("text")
      .text("fWAR Explanation")
      .attr("x", width * 230 / 1000)
      .attr("y", height + margin.bottom - 7)
      .style("text-decoration", "underline")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .style("font-style", "italic")
      .style("letter-spacing", "0.52px")
      .style("font-family", "Calibri")


  let signature = {
    "text": "@SequentialChaos",
    "link": "https://twitter.com/sequentialchaos",
    "size": 20,
    "color": "#226978"
  }

  svg.append("a")
      .attr("href", signature.link)
      .attr("target", "_blank")
    .append("text")
      .attr("x", width + margin.left + margin.right - 8)
      .attr("y", height + margin.top + margin.bottom - 8)
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