document.addEventListener('DOMContentLoaded', function() {
    // Load data from CSV files and merge
    Promise.all([
        loadData("https://docs.google.com/spreadsheets/d/e/2PACX-1vR9KmvTArEvOntjGpzFbpai7tfGCE4atG7cre5BiG_CEhMQw7cOo6bz-SmgJRY7rGCP7ERnRywkwiw7/pub?gid=1872440968&cachebeater=8&single=true&output=csv"),
        loadData("https://docs.google.com/spreadsheets/d/e/2PACX-1vR9KmvTArEvOntjGpzFbpai7tfGCE4atG7cre5BiG_CEhMQw7cOo6bz-SmgJRY7rGCP7ERnRywkwiw7/pub?gid=1821472518&cachebeater=3&single=true&output=csv"),
        loadData("https://docs.google.com/spreadsheets/d/e/2PACX-1vR9KmvTArEvOntjGpzFbpai7tfGCE4atG7cre5BiG_CEhMQw7cOo6bz-SmgJRY7rGCP7ERnRywkwiw7/pub?gid=123426330&cachebeater=2&single=true&output=csv"),
        loadData("https://docs.google.com/spreadsheets/d/e/2PACX-1vR9KmvTArEvOntjGpzFbpai7tfGCE4atG7cre5BiG_CEhMQw7cOo6bz-SmgJRY7rGCP7ERnRywkwiw7/pub?gid=402113435&cachebeater=6&single=true&output=csv"),
        loadData("https://docs.google.com/spreadsheets/d/e/2PACX-1vR9KmvTArEvOntjGpzFbpai7tfGCE4atG7cre5BiG_CEhMQw7cOo6bz-SmgJRY7rGCP7ERnRywkwiw7/pub?gid=1918593179&cachebeater=7&single=true&output=csv")
    ]).then(function(results) {
      // Merge data from all CSV files
      data = { SampleLog: results[1], GeoLabels: results[3] };
      var mergedData = mergeData(results.map(function(result) {
          return result.data;

      }));

     
      console.log("SampleLog", results[1]);
      console.log("GeoLabels", results[3]);

      // Log merged data to console
      console.log("Merged Data:", mergedData);

      // Extract latitude and E. Coli levels
      var ecoliData = mergedData.map(function (item) {
        console.log("Latitude:", item.Latitude);
        console.log("Ecoli:", item["E coli"]);
        return {
          latitude: parseFloat(item.Latitude),
          ecoli: parseFloat(item["E coli"]),
        };
      });

      // Remove data points with NaN values
      ecoliData = ecoliData.filter(function (item) {
        return !isNaN(item.latitude) && !isNaN(item.ecoli);
      });

      // Create map
      createMap(mergedData);

      // Create bar chart
      createBarChart(ecoliData);
    }).catch(function(error) {
        console.error("Error loading or merging data:", error);
    });

    // Function to load data from a CSV file
    function loadData(url) {
        return new Promise(function(resolve, reject) {
            Papa.parse(url, {
                download: true,
                header: true,
                dynamicTyping: true,
                complete: function(results) {
                    resolve(results);
                },
                error: function(error) {
                    reject(error);
                }
            });
        });
    }

    // Function to merge data from multiple CSV files
    function mergeData(dataArray) {
        // Merge the arrays of data objects
        return dataArray.reduce(function(acc, data) {
            return acc.concat(data);
        }, []);
    }

    // Function to create map using Leaflet
    function createMap(data) {
        var map = L.map('map-container').setView([38.4405, -122.7141], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="OpenStreetMap">OpenStreetMap</a> contributors'
        }).addTo(map);

        data.forEach(function(item) {
            // Check if Latitude and Longitude are valid numbers
            var lat = parseFloat(item.Latitude);
            var lng = parseFloat(item.Longitude);

            if (!isNaN(lat) && !isNaN(lng)) {
                // Create a marker with a black dot
                L.circleMarker([lat, lng], {
                    radius: 5,
                    color: 'blue',
                    fillOpacity: 1
                }).addTo(map);
            }
        });
    }

    // Function to create bar chart using D3.js
    function createBarChart(data) {
        var margin = { top: 20, right: 30, bottom: 30, left: 60 },
            width = 600 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        var svg = d3.select("#bar-chart-container")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) { return d.ecoli; })])
            .range([0, width]);

        var y = d3.scaleLinear()
            .domain([d3.min(data, function(d) { return d.latitude; }), d3.max(data, function(d) { return d.latitude; })])
            .range([height, 0]);

        var xAxis = d3.axisBottom(x);
        var yAxis = d3.axisLeft(y);

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .call(yAxis);

        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", function(d) { return y(d.latitude); })
            .attr("width", function(d) { return x(d.ecoli); })
            .attr("height", 4);
    }
});