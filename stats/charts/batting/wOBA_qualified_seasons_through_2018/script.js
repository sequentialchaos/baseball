// Global variables    
let svg = d3.select("div#chart svg"),
  margin = { top: 60, right: 10, bottom: 70, left: 90 },
  width = svg.attr("width") - margin.left - margin.right,
  height = svg.attr("height") - margin.top - margin.bottom,
  g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Define scales with their ranges
let x = d3.scaleLinear()
  .range([0, width]);
let y = d3.scaleLinear()
  .range([height, 0]);

// CSV
let csvfile = "../../../data/fangraphs/wOBA_qualified_seasons_through_2018.csv";
d3.csv(csvfile, function(d) { 
  return {
    season: +d.Season,
    year: new Date(+d.Season, 1),
    name: d.Name,
    team: d.Team,
    wOBA: +d.wOBA,
    PA: +d.PA 
  };
}).then(function(data) {
  let dataset = data;
  //console.log(dataset);

  // Calculate median wOBA for each season
  let seasons = d3.range(d3.min(dataset, d => d.season), d3.max(dataset, d => d.season) + 1);
  // console.log(seasons);
  let medians = [];
  seasons.forEach(season => {
    let rows = dataset.filter(d => d.season == season);
    medians.push({
      "season" : season,
      "wOBA" : d3.median(rows, r => r.wOBA)
    })
  });
  // console.log(medians);

  // Add domains to the scales
  let xMin = d3.min(dataset, d => d.season) - 1;
  let xMax = d3.max(dataset, d => d.season) + 1;
  x.domain([xMin, xMax]);
  y.domain(d3.extent(dataset, d => d.wOBA)).nice();

  // Draw axes with labels to SVG
  // X axis - Year/Season
  g.append("g")
    .attr("class", "axis axis_x")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(20).tickFormat(d3.format("0")))
    .append("text")
      .attr("x", width / 2)
      .attr("y", margin.bottom - 30)
      .attr("dy", "0.30em")
      .style("font-size", 26)
      .style("text-anchor", "middle")
      .style("fill", "black")
      .style("font-weight", "bold")
      .text("Season");

  // Y axis - Gray Ink
  g.append("g")
    .attr("class", "axis axis_y")
    .call(d3.axisLeft(y).tickFormat(d3.format("0.3f")))
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 26 - margin.left)
      .attr("dy", "0.30em")
      .style("font-size", 26)
      .style("text-anchor", "middle")
      .style("fill", "black")
      .style("font-weight", "bold")
      .text("wOBA");
  
  g.append("g")
    .attr("class", "point")
    .selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
      .attr("class", function(d) {
        return d.season + " " + d.team + " " + d.name;
      })
      .attr("cx", d => x(d.season))
      .attr("cy", d => y(d.wOBA))
      .attr("r", 3)
      .attr("fill", "#ABBABA")
      .attr("fill-opacity", 0.75)
      .attr("stroke", "black")
      .on("mouseover", function(d) {
        let circle = d3.select(this)
        
        circle.attr("r", 6).attr("fill", "#17EBF0").attr("fill-opacity", 0.85);
        // Tooltips
        var xPosition = x(d.season) + 110;
        var yPosition = y(d.wOBA) + 100;

        let tooltip = d3.select("#tooltip")
          .style("left", xPosition + "px")
          .style("top", yPosition + "px")

        tooltip.select("#season").text(d.season);
        tooltip.select("#wOBA").text(d3.format(".3r")(d.wOBA));
        tooltip.select("span#name").text(d.name + ", ");

        d3.select("#tooltip").classed("hidden", false);
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", "#ABBABA").attr("r", 3);
        d3.select("#tooltip").classed("hidden", true);
      })
  
  // Median
  // Median Line
  let line = d3.line()
    .x(d => x(d.season))
    .y(d => y(d.wOBA));

  g.append("path")
    .datum(medians)
    .attr("class", "line")
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", "#00EAEA")
    .attr("stroke-width", 5)
    .attr("stroke-linecap", "round");
  
  // Median Points
  g.selectAll("circle.median")
    .data(medians)
    .enter()
    .append("circle")
      .attr("class", "median")
      .attr("cx", d => x(d.season))
      .attr("cy", d => y(d.wOBA))
      .attr("r", 4)
      .attr("fill", "black")
      .attr("fill-opacity", 0.0)
      .on("mouseover", function(d) {
        d3.select(this).attr("r", 6).attr("fill", "red").attr("fill-opacity", 1);
        // Tooltips
        var xPosition = x(d.season) + 110;
        var yPosition = y(d.wOBA) + 100;

        let tooltip = d3.select("#tooltip-median")
          .style("left", xPosition + "px")
          .style("top", yPosition + "px")

        tooltip.select("#tooltip-median span#season").text(d.season);
        tooltip.select("#tooltip-median span#wOBA").text(d3.format(".3r")(d.wOBA));

        d3.select("#tooltip-median").classed("hidden", false);
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 3).attr("fill-opacity", 0);
        d3.select("#tooltip-median").classed("hidden", true);
      })

  // Draw legend
  let legend_options = {
    "x": width * 3 / 4,
    "y": height * 12 / 15,
    "width": 135,
    "height": 25,
    "text": "median line",
    "color": "white",
  }

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
    .attr("fill", legend_options.color)
    .attr("stroke", "black");

  legend.append("rect")
      .attr("x", 6)
      .attr("y", legend_options.height / 3 + 2)
      .attr("width", 35)
      .attr("height", 7)
      .attr("fill", "#00EAEA")
      .style("cursor", "pointer")
      .on("click", function() {
        let value = d3.select(".line").classed("hidden");
        // console.log(value);
        if (value == true)
          d3.select(".line").classed("hidden", false);
        else
          d3.select(".line").classed("hidden", true);
      })
      
  legend.append("text")
      .attr("x", 46)
      .attr("y", legend_options.height / 2 + 4)
      .text(legend_options.text)
      .attr("font-size", 17)
      .attr("font-family", "Calibri")
      .attr("font-weight", "bold")
      .style("cursor", "pointer")
      .on("click", function() {
        let value = d3.select(".line").classed("hidden");
        // console.log(value);
        if (value == true)
          d3.select(".line").classed("hidden", false);
        else
          d3.select(".line").classed("hidden", true);
      })

  // Titles
  let title = {
    "text": "wOBA over the years",
    "size": 36,
    "y": -24,
    sub: {
      "text": "All qualified seasons from 1871 to 2018",
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
    "text": "www.fangraphs.com",
    "size": 17,
    "link": "https://www.fangraphs.com/leaders.aspx?pos=all&stats=bat&lg=all&qual=y&type=8&season=2018&month=0&season1=1871&ind=1&team=&rost=&age=&filter=&players=",
    "font_family": "Calibri",
    "color": "50AE26"
  }

  g.append("a")
    .attr("href", source.link)
    .attr("target", "_blank")
    .append("text")
    .attr("x", -margin.left + 60)
    .attr("y", height + margin.bottom - 6)
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


  // Random color maker
  let hue = 0;
  let randomColor = function() {
    let randomInt = (min, max) => Math.floor(Math.random() * (max - min) + min);
    let hsl = [hue, randomInt(85, 101) + '%', "62%"];
    hue += 28;
    return "hsl(" + hsl.join(",") + ")";
  }
  // Search
  let names = dataset.map(d => d.name);
  unique_names = names.filter((d, i) => i == names.indexOf(d));
  // console.log(unique_names);
  d3.select("datalist#names")
    .selectAll("option")
      .data(unique_names)
      .enter()
      .append("option")
        .attr("value", d => d);
      
  d3.select("button.search")
    .on("click", function() {
      let name = d3.select("input.search").property("value");
      // console.log(name);
      let filter = dataset.filter(d => d.name == name);
      filter.sort((d, e) => d.season - e.season);
      // console.log(filter);
      if (name.length > 0) {
        g.append("path")
          .datum(filter)
          .attr("class", "player-line " + name)
          .attr("d", line)
          .attr("fill", "none")
          .attr("stroke", () => {
            let color = randomColor();
            // console.log(color);
            return color;
          })
          .attr("stroke-width", 5)
          .attr("stroke-linecap", "round");
        // let player_line = d3.line()
        //   .x(d.season)
        //   .y(d.wOBA)
        // d3.selectAll("circle." + name)
        //   .attr("r", 12);
      }
    });
  
  // Clear lines button
  d3.select("button.clear")
      .on("click", function() {
        d3.selectAll(".player-line").classed("hidden", "true");
        hue = 0;
      })

})