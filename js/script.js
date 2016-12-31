var teams = [];

function find_team(team_code) {
    for (var i = 0; i < teams.length; i++) {
        if (teams[i].shortName === team_code) {
            return teams[i];
        }
    }
    return undefined;
}

var process_form = function(team_code) {
    // Finding the correct team
    var team = find_team(team_code);
    var player_link = team._links.players;
    // Getting the player link to pass it to the API call
    player = player_link.href;
    name = team.name;
    crest = team.crestUrl;
    // Puts crest and team name on page
    var divOutput = document.getElementById("output");
    divOutput.innerHTML = " ";
    var add = document.createTextNode(name);
    var title = document.createElement("h2");
    var img = document.createElement("img");
    var divImage = document.createElement("div");
    divImage.id = "crest";
    var divTeam = document.createElement("div");
    divTeam.id = "team-name";
    img.src = crest;
    divImage.appendChild(img);
    divOutput.appendChild(divImage);
    title.appendChild(add);
    divTeam.appendChild(title);
    divOutput.appendChild(divTeam);
};

//Get player information of a team
var process_player = function() {
    var data = JSON.parse(xhttp2.response);
    var item = data.players;
    // Saving info in an array to use it with visualisation
    var names = [];
    var values = [];
    var countries = [];
    for (var i = 0; i < item.length; i++) {
        person = item[i];
        name = person.name;
        names.push(name);
        value = person.marketValue;
        values.push(value);
        country = person.nationality;
        // Changing certain countries to UK as map visualisation cannot distinguish between regions
        if (country === "England" || country === "Scotland" || country === "Wales" || country === "Northern Ireland") {
            countries.push("United Kingdom");
        } else {
            countries.push(country);
        }
    }
    chart(names, values, countries);
};

//dropdown menu options - team names
var processXHRResponse = function() {
    var data = JSON.parse(xhttp.response);
    teams = data.teams;
    for (var i = 0; i < teams.length; i++) {
        team = teams[i];
        name = team.name;
        crest = team.crestUrl;
        dropdownElement = document.createTextNode(name);
        option = document.createElement("option");
        option.value = team.shortName;
        option.appendChild(dropdownElement);
        document.getElementById("myteam").appendChild(option);
    }
};

var chart = function(names, values, countries) {
    container = document.getElementById("regions_div");
    container.innerHTML = " ";
    google.charts.load("upcoming", {
        callback: drawRegionsMap,
        packages: ["geochart"]
    });
    // Google GeoChart
    function drawRegionsMap() {
        // Formatting data to two columns
        var data = [];
        var header = ["Country", "Name"];
        data.push(header);
        for (var i = 0; i < countries.length; i++) {
            var temp = [];
            temp.push(countries[i]);
            temp.push(names[i]);
            data.push(temp);
        }
        var chartdata = google.visualization.arrayToDataTable(data);
        // http://stackoverflow.com/questions/41190424/google-geochart-same-countries-different-values/41271678#41271678
        // Group data by country, name
        var groupdata = google.visualization.data.group(
            chartdata, [0, 1], [{
                aggregation: google.visualization.data.count,
                column: 1,
                label: "Name",
                type: "number"
            }]
        );

        // Update tooltip for each chart data row
        for (var i = 0; i < chartdata.getNumberOfRows(); i++) {
            // Find group rows for current country
            var locationRows = groupdata.getFilteredRows([{
                column: 0,
                value: chartdata.getValue(i, 0)
            }]);

            // Build tooltip of all names for current country
            var nameTooltip = "";
            locationRows.forEach(function(index) {
                if (nameTooltip !== "") {
                    nameTooltip += ", ";
                }
                nameTooltip += groupdata.getValue(index, 1);
            });

            // Update tooltip
            chartdata.setValue(i, 1, nameTooltip);
        }

        var chart = new google.visualization.GeoChart(container);
        var options = {
            tooltip: {
                isHtml: true
            },
            defaultColor: "rgb(7, 39, 135)",

        };
        chart.draw(chartdata, options);

        // Defining a handler making the Geochart responsive
        function resizeHandler() {
            chart.draw(chartdata);
        }
        if (window.addEventListener) {
            window.addEventListener("resize", resizeHandler, false);
        } else if (window.attachEvent) {
            window.attachEvent("onresize", resizeHandler);
        }
        drawPie();
    }

    function drawPie() {
        // Counting the occurrences of countries
        var playersCountries = [],
            numPlayers = [],
            prev;
        countries.sort();
        for (var i = 0; i < countries.length; i++) {
            if (countries[i] !== prev) {
                playersCountries.push(countries[i]);
                numPlayers.push(1);
            } else {
                numPlayers[numPlayers.length - 1]++;
            }
            prev = countries[i];
        }

        // Making the pie chart responsive
        var d3 = Plotly.d3;

        var WIDTH_IN_PERCENT_OF_PARENT = 90,
            HEIGHT_IN_PERCENT_OF_PARENT = 90;

        var countryPie = d3.select("div[id='countryPie']")
            .style({
                width: WIDTH_IN_PERCENT_OF_PARENT + '%',
                'margin-left': (100 - WIDTH_IN_PERCENT_OF_PARENT) / 2 + '%',

                height: HEIGHT_IN_PERCENT_OF_PARENT + 'vh',
                'margin-top': (100 - HEIGHT_IN_PERCENT_OF_PARENT) / 2 + 'vh',
            });

        var countriesPie = countryPie.node();

        // Defining the first pie chart
        var infoValue = [{
            values: numPlayers,
            showlegend: false,
            labels: playersCountries,
            type: "pie",
            textinfo: "label+value",
            textposition: "inside",
        }];

        var CountryLayout = {
            title: "Number of players from each country",
        };

        // Making the pie chart responsive
        var playerPie = d3.select("div[id='playerPie']")
            .style({
                width: WIDTH_IN_PERCENT_OF_PARENT + '%',
                'margin-left': (100 - WIDTH_IN_PERCENT_OF_PARENT) / 2 + '%',

                height: HEIGHT_IN_PERCENT_OF_PARENT + 'vh',
                'margin-top': (100 - HEIGHT_IN_PERCENT_OF_PARENT) / 2 + 'vh',
            });

        var playersPie = playerPie.node();

        // Player market value
        numbers = [];
        for (var i = 0; i < values.length; i++) {
            var currency = values[i];
            // Some have value set as null, changing to 0
            if (currency === null) {
                numbers.push(0);
            } else {
                // Changing the currency string to number,
                var number = Number(currency.replace(/[^0-9\.]+/g, ""));
                numbers.push(number);
            }
        }

        // Defining the second pie chart
        var piePlayers = [{
            values: numbers,
            labels: names,
            showlegend: false,
            type: "pie",
            textinfo: "label+value",
            textposition: "inside",
        }];

        var PlayerLayout = {
            title: "Part of the team market value in \u20AC",
        };

        Plotly.newPlot(countriesPie, infoValue, CountryLayout);
        window.addEventListener('resize', function() {
            Plotly.Plots.resize(countriesPie);
        });

        Plotly.newPlot(playersPie, piePlayers, PlayerLayout);
        window.addEventListener('resize', function() {
            Plotly.Plots.resize(playersPie);
        });

    }
};

// encoding the parameters
var encodeParameters = function(params) {
    var strArray = [];
    for (var key in params) {
        if (params.hasOwnProperty(key)) {
            var paramString = encodeURIComponent(key) + "/" + encodeURIComponent(params[key]);
            strArray.push(paramString);
        }
    }
    return strArray.join("&");
};

// the parameters for the API request
var parameters = {
    competitions: 426,
};

// auth Token obtainable from http://api.football-data.org/register
var authToken = '2fe40f6ab37b43cca925d6fac9b05a0e';

// do the XHR request
var base_url = 'https://api.football-data.org/v1/';
var query_url = base_url + encodeParameters(parameters) + "/" + "teams";

// first API request accessing all of the teams
var xhttp = new XMLHttpRequest();
xhttp.addEventListener('load', processXHRResponse);
xhttp.open('GET', query_url);
xhttp.setRequestHeader("X-Auth-Token", authToken);
xhttp.send();

var doSearch = function() {
    var search_term = document.getElementById("myteam").value;
    process_form(search_term);
};

// second API request for players
var searchPlayer = function() {
    xhttp2 = new XMLHttpRequest();
    xhttp2.addEventListener('load', process_player);
    xhttp2.open('GET', player);
    xhttp2.setRequestHeader("X-Auth-Token", authToken);
    xhttp2.send();
};

window.onload = function() {
    var search_button = document.getElementById("search_button");
    search_button.addEventListener("click", doSearch);
    search_button.addEventListener("click", searchPlayer);
};
