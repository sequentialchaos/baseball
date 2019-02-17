// Global variables    
let svg = d3.select("div#chart svg"),
  margin = { top: 60, right: 25, bottom: 70, left: 75 },
  width = svg.attr("width") - margin.left - margin.right,
  height = svg.attr("height") - margin.top - margin.bottom,
  g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Define scales with their ranges
let x = d3.scaleLinear()
  .range([0, width]);
let y = d3.scaleLinear()
  .range([height, 0]);

// Voronoi
var voronoi = d3.voronoi()
  .x(function (d) { return x(d.date); })
  .y(function (d) { return y(d.value); })
  .extent([[-margin.left, -margin.top],
  [width + margin.right, height + margin.bottom]]);

// Types of players
let player_types = ["inHoF", "notInHoF", "ineligible"];

// Colors
let colors = {
  "blackInk": "black",
  "grayInk": "#535353",
  "inHoF": "#C1AB32",
  "ineligible": "#1F9332",
  "notInHoF": "#4B3D3D",
  "top_right": "#A0E8A8",
  "top_left": "#D2F4BD",
  "bottom_left": "#EF8686",
  "bottom_right": "#D2F4BD",
  "legend_background": "#DAD3CE"
}

// CSV
let csvfile = "../../../data/bbref/ink/pitching_top_1000_in_gray_ink.csv";
d3.csv(csvfile, function (d) {
  let name = d["Name"];
  let formattedName = name;
  let lastIndex = name.length - 1;

  let inHoF = false;
  if ("*" == name[lastIndex]) {
    inHoF = true;
    formattedName = name.substring(0, lastIndex);
  }

  let ineligible = false;
  if ("+" == name[lastIndex]) {
    ineligible = true;
    formattedName = name.substring(0, lastIndex);
  }

  return {
    name: formattedName,
    grayInk: +d.GrayInk,
    blackInk: +d.BlackInk,
    inHoF: inHoF,
    ineligible: ineligible
  };
}).then(function (data) {
  let players = data;
  console.log(players);

  let hall_of_famers = [];
  players.forEach(function (p) {
    if (p.inHoF)
      hall_of_famers.push(p);
  })


  console.log(hall_of_famers);

  let xDomain = d3.extent(players, p => p.blackInk);
  let xMin = d3.min(players, p => p.blackInk) - 1;
  let xMax = d3.max(players, p => p.blackInk) + 10;
  let yMin = d3.min(players, p => p.grayInk) - 4;
  let yMax = d3.max(players, p => p.grayInk) + 30;

  // Set domains for the scales based on the data
  x.domain([xMin, xMax]);//[xMin, xMax]);
  y.domain([yMin, yMax]);

  // Draw axes with labels to SVG
  // X axis - Black Ink
  g.append("g")
    .attr("class", "axis axis_x")
    .attr("transform", "translate(0," + height + ")")
    .style("color", colors.blackInk)
    .call(d3.axisBottom(x).ticks(15))
    .append("text")
    .attr("x", width / 2)
    .attr("y", margin.bottom - 30)
    .attr("dy", "0.30em")
    .style("font-size", 23)
    .style("text-anchor", "middle")
    .style("fill", colors.blackInk)
    .style("font-weight", "bold")
    .text("Black Ink");

  // Y axis - Gray Ink
  g.append("g")
    .attr("class", "axis axis_y")
    .style("color", colors.grayInk)
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 23 - margin.left)
    .attr("dy", "0.30em")
    .style("font-size", 23)
    .style("text-anchor", "middle")
    .style("fill", colors.grayInk)
    .style("font-weight", "bold")
    .text("Gray Ink");

  // Get medians of hall of famers
  let median = {
    "horizontal": d3.median(hall_of_famers, p => p.grayInk),
    "vertical": d3.median(hall_of_famers, p => p.blackInk)
  }

  // Quadrants
  let quadrants = g.append("g")
    .attr("class", "quadrant");

  // Top-right quadrant
  quadrants.append("rect")
    .attr("x", x(median.vertical))
    .attr("y", 0)
    .attr("width", width - x(median.vertical))
    .attr("height", y(median.horizontal))
    .attr("fill", colors.top_right);

  // Top-left quadrant
  quadrants.append("rect")
    .attr("x", 1)
    .attr("y", 0)
    .attr("width", x(median.vertical))
    .attr("height", y(median.horizontal))
    .attr("fill", colors.top_left);

  // Bottom-left quadrant
  quadrants.append("rect")
    .attr("x", 1)
    .attr("y", y(median.horizontal))
    .attr("width", x(median.vertical))
    .attr("height", height - y(median.horizontal))
    .attr("fill", colors.bottom_left);

  // Bottom-right quadrant
  quadrants.append("rect")
    .attr("x", x(median.vertical))
    .attr("y", y(median.horizontal))
    .attr("width", width - x(median.vertical))
    .attr("height", height - y(median.horizontal))
    .attr("fill", colors.bottom_right);

  // Draw median lines
  // Horizontal - Gray Ink - Average Hall of Famer
  let medianH = g.append("g")
    .attr("class", "median horizontal")

  medianH.append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", y(median.horizontal))
    .attr("y2", y(median.horizontal))
    .attr("stroke", colors.grayInk)
    .attr("stroke-width", 3)
    .attr("stroke-dasharray", 4)

  medianH.append("text")
    .attr("x", 2)
    .attr("y", y(median.horizontal) - 7)
    .text("Median Hall of Famer")
    .style("font-size", 13)
    .style("font-family", "Calibri");

  // Vertical - Black Ink - Average Hall of Famer
  let medianV = g.append("g")
    .attr("class", "median vertical")

  medianV.append("line")
    .attr("x1", x(median.vertical))
    .attr("x2", x(median.vertical))
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", colors.blackInk)
    .attr("stroke-width", 3)
    .attr("stroke-dasharray", 4);

  medianV.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height + 4)
    .attr("y", x(median.vertical) + 12)
    .text("Median Hall of Famer")
    .style("font-size", 13)
    .style("font-family", "Calibri")
    .style("font-weight", "none");

  // Draw points
  g.append("g")
    .attr("class", "point")
    .selectAll("circle")
    .data(players)
    .enter()
    .append("circle")
    .attr("class", p => {
      if (p.inHoF)
        return "inHoF";
      if (p.ineligible)
        return "ineligible";
      return "notInHoF";
    })
    .attr("cx", p => x(p.blackInk))
    .attr("cy", p => y(p.grayInk))
    .attr("r", 6)
    .attr("fill", p => {
      if (p.inHoF)
        return colors.inHoF;
      if (p.ineligible)
        return colors.ineligible;
      return colors.notInHoF;
    })
    .attr("stroke", "black")
    .on("mouseover", function (p) {
      d3.select(this).attr("r", 10);

      // Tooltips
      var xPosition = x(p.blackInk) + 94;
      var yPosition = y(p.grayInk) + 64;

      let tooltip = d3.select("#tooltip")
        .style("left", xPosition + "px")
        .style("top", yPosition + "px")

      tooltip.select("#blackInk").text(p.blackInk);
      tooltip.select("#grayInk").text(p.grayInk);
      tooltip.select("span#name").text(p.name);

      d3.select("#tooltip").classed("hidden", false);
    })
    .on("mouseout", function () {
      d3.select(this).attr("r", 6);
      d3.select("#tooltip").classed("hidden", true);
    })

  // Draw legend
  let legend_options = {
    "x": width * 2 / 3,
    "y": height * 11 / 15,
    "width": 220,
    "height": 102
  }
  let legend_text = {
    "title": "Legend",
    "note": "Click to toggle the matching points!",
    "inHoF": "Hall of Famer",
    "ineligible": "Active or retired after 2013",
    "notInHoF": "Non Hall of Famer"
  };

  let legend = g.append("svg")
    .attr("class", "legend")
    .attr("x", legend_options.x)
    .attr("y", legend_options.y)
    .attr("width", legend_options.width)
    .attr("height", legend_options.height);

  // Legend background
  legend.append("rect")
    .attr("width", legend_options.width)
    .attr("height", legend_options.height)
    .attr("fill", colors.legend_background)
    .attr("stroke", "black");

  // Legend title
  legend.append("text")
    .attr("x", legend_options.width / 2)
    .attr("y", 22)
    .text(legend_text.title)
    .style("font-family", "Calibri")
    .style("font-size", 24)
    .style("font-weight", "bold")
    .style("font-style", "underline")
    .style("text-anchor", "middle");

  // Legend main
  player_types.forEach((type, i) => {
    let square = {
      "x": legend_options.width / 20,
      "y": 22 + 9 + legend_options.height * i / 6,
      "width": 12,
      "height": 12
    }
    legend.append("rect")
      .attr("class", type)
      .attr("x", square.x)
      .attr("y", square.y)
      .attr("width", square.width)
      .attr("height", square.height)
      .attr("fill", colors[type])
      .attr("stroke", "black")
      .style("cursor", "pointer")
      .on("click", function () {
        let circles = d3.selectAll("circle." + type);
        if (circles.classed("hidden")) {
          circles.classed("hidden", false);
        } else {
          circles.classed("hidden", true);
        }
      });

    legend.append("text")
      .attr("x", square.x + square.width + 5)
      .attr("y", square.y + square.height)
      .text(legend_text[type])
      .style("font-family", "Calibri")
      .style("cursor", "pointer")
      .on("click", function () {
        let circles = d3.selectAll("circle." + type);
        if (circles.classed("hidden")) {
          circles.classed("hidden", false);
        } else {
          circles.classed("hidden", true);
        }
      });
  })

  // Legend note
  legend.append("text")
    .attr("x", legend_options.width / 2)
    .attr("y", legend_options.height - 5)
    .text(legend_text.note)
    .style("font-family", "Calibri")
    .style("font-size", 13)
    .style("text-anchor", "middle");

  // Titles
  let title = {
    "text": "Gray Ink vs. Black Ink",
    "size": 28,
    "y": -30,
    sub: {
      "text": "Pitchers in the top 1000 in Gray Ink",
      "size": 16
    }
  }

  // Main title    
  g.append("text")
    .attr("class", "title")
    .attr("x", width / 2)
    .attr("y", title.y)
    .text(title.text)
    .style("font-size", title.size)
    .style("font-weight", "bold")
    .style("text-anchor", "middle");

  // Subtitle
  g.append("text")
    .attr("class", "title sub")
    .attr("x", width / 2)
    .attr("y", title.y + 20)
    .text(title.sub.text)
    .style("font-size", title.sub.size)
    .style("font-style", "italic")
    .style("text-anchor", "middle");

  // Sources
  let source = {
    "label": "source: ",
    "text": "www.baseball-reference.com",
    "size": 14,
    "link": "https://www.baseball-reference.com/leaders/gray_ink.shtml",
    "font_family": "Calibri"
  }

  g.append("a")
    .attr("href", source.link)
    .attr("target", "_blank")
    .append("text")
    .attr("x", -margin.left + 51)
    .attr("y", height + margin.bottom - 5)
    .attr("class", "source")
    .text(source.text)
    .style("font-size", source.size)
    .style("font-weight", "bold")
    .style("text-anchor", "start")
    .style("font-family", source.font_family)
    .style("font-style", "italic");

  g.append("text")
    .attr("x", -margin.left + 5)
    .attr("y", height + margin.bottom - 5)
    .attr("class", "source")
    .text(source.label)
    .style("font-size", source.size)
    .style("font-weight", "bold")
    .style("text-anchor", "start")
    .style("font-family", source.font_family)

  // Signature
  let signature = {
    "text": "@SequentialChaos",
    "link": "https://twitter.com/sequentialchaos",
    "size": 15,
    "color": "#063C47"
  }

  g.append("a")
    .attr("href", signature.link)
    .attr("target", "_blank")
    .append("text")
    .attr("x", width + margin.right - 5)
    .attr("y", height + margin.bottom - 5)
    .attr("class", "signature")
    .text(signature.text)
    .style("fill", signature.color)
    .style("font-size", signature.size)
    .style("font-weight", "bold")
    .style("text-anchor", "end")
    .style("font-family", "Cambria");

}).catch(function (error) {
    console.log(error);
  });
