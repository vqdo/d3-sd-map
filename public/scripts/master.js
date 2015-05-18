/**
 * Integrate D3.js with available Delphi tables. 
 * 
 * author: Victoria Do
 * May 2015
 */

var DelphiDemo = DelphiDemo || (function() {
  var self = {};

  self.cache = {};

  // Features that represent SD regions
  var regions = [
    {
      name: "North Coastal",
      subregions: [40, 41, 42, 43, 52]
    },
    {
      name: "North Central",
      subregions: [2, 10, 11, 12, 13, 16, 17]
    },
    {
      name: "Central",
      subregions: [1, 5, 6]
    },
    {
      name: "South",
      subregions: [3, 4, 20, 21, 22]
    },
    {
      name: "East",
      subregions: [30, 31, 32, 33, 34, 35, 36, 37, 38, 61, 62]
    },    
    {
      name: "North Inland",
      subregions: [14, 15, 39, 50, 51, 53, 54, 55, 60, 63]
    }   
  ];
  var graph = {
    created: false,
    upperLimit: 0,

    datasets: []
  };

  /**
   * Default handlers for zip code form 
   */
  self.onBadInput = function(input) {
    $('.message').html("No results for <strong>" + input + "</strong>");
  }
  self.onGoodInput = function(input) {
    if(input) {
      $('.current-zip').html("Viewing " + input);
      $('.message').html('');
    }
  }

  /** 
   * Turn data into something more agreeable to D3 
   */
  var transformData = function(data) {
    var points = [];
    // divisor for calculating percentages
    var sum = 0;
    $.each(data, function(x,y) { sum += +y; });
    sum /= 100;

    $.each(data, function(x, y) {
      points.push({name: x, value: +y, pc: Math.round(+y/sum)});
    });

    return points;
  };

  var zoomed = function() {
    // features.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
    //     .selectAll("path").style("stroke-width", 1 / zoom.scale() + "px" );
  }  

  // Add optional onClick events for features here
  // d.properties contains the attributes (e.g. d.properties.name, d.properties.population)
  var clicked = function(d,i) {

  }  

  /**
   * Create graph for the first time
   */
  var createGraph = function(data) {
    if(graph.created) return;


    //Map dimensions (in pixels)
    var width = $(window).width(),
        height = $(window).height(),
        scale = $(window).height() * 35;

    //Map projection
    var projection = d3.geo.mercator()
        .scale(scale)
        .center([-116.83874700000001,33.02092699499224]) //projection center
        .translate([width/2,height/3 + 50]) //translate to center the map in view

    //Generate paths based on projection
    var path = d3.geo.path()
        .projection(projection);

    //Create an SVG
    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    //Group for the map features
    var features = svg.append("g")
        .attr("class","features");

    //Create zoom/pan listener
    //Change [1,Infinity] to adjust the min/max zoom scale
    var zoom = d3.behavior.zoom()
        .scaleExtent([1, Infinity])
        .on("zoom",zoomed);

    svg.call(zoom);

    d3.json("data/SRA2010tiger.topojson",function(error,geodata) {
      if (error) return console.log(error); //unknown error, check the console
      console.log(geodata.objects.SRA2010tiger);
      var subunits = topojson.feature(geodata, geodata.objects.SRA2010tiger);
      console.log(subunits);

      $.each(regions, function(i, region) {
        var filtered = geodata.objects.SRA2010tiger.geometries.filter(function(d) { return $.inArray(d.properties.SRA, region.subregions) > -1; });
        var geo = topojson.merge(geodata, filtered);
        features.append("path")
          .datum(geo)
          .attr("d", path)
      });

      // features.selectAll("path")
      //    .data(subunits.features)
      //    .enter()
      //    .append("path")
      //    .attr("d",path)
      //    .on("click",clicked);

    });

  };

  /**
   * Update the "compare" data set */
  var updateDataSet = function(data, id) {
    if(!graph.datasets.id) {
      return addDataSet(data, id);
    }
   
  }

  /** 
   * Add a data set with the passed in id 
   */
  var addDataSet = function(data, id) {
  
  }

    /** 
     * Check that the result from the server is non-empty 
     */
    var verifyData = function(data, param) {
      // If values are null, this means the server did not return any results
      if(data !== null) {
        self.onGoodInput(param);
        return true;
      }

      self.onBadInput(param);      
      return false;
    }

  /** 
   * Send an ajax request to the server with the provided zip code.
   * Update the graph with this data, if good.
   */ 
  self.getCausesOfDeath = function(zip) {
    console.log("Getting data");
    $.get("/api/causes_of_death", zip && {zipcode: zip}, function(data) {
        if(!verifyData(data, zip)) return;

        var points = transformData(data);

        if(!graph.created) {
          createGraph(points);
        } else {
          updateDataSet(points, "compare");
        }

        self.cache[zip || "all"] = points;
      }
    );
  };

  /** 
   * initialize 
   */
  self.init = function() {
    createGraph();
  };

  return self;
})();

$(document).ready(function() {
  DelphiDemo.init();


});