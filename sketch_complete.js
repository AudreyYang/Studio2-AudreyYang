var garamound;
var calibri;
var verdana;
var wars = [];
var table;
var countries;
var countriesMap = [];
var attractors = [];
var attractorsC = [];
var countriesToDisplay = [];
var yearToDisplay = 1823;
var slider;
var sliderValuePrevious;
var particleSystem = [];

var Country = function (name, polygon) {
    this.name = name;

    //an array with lat lons to draw the polygon
    this.polygon = polygon;

    //lat lon center of the polygon
    this.center = getCentroid(this.polygon);

    this.particleSystem = [];

}

/* HERE WE LOAD TABLES */
function preload() {
    table = loadTable("data/Inter-StateWar.csv", "csv", "header");
    countries = loadJSON("map.geojson");
    garamound = loadFont("fonts/Garamond_Regular.ttf");
    calibri = loadFont("fonts/Calibri.ttf");
    verdana = loadFont("fonts/Verdana.ttf");
}

//+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+

/* WARS AND ITS PARTICIPANTS */
var War = function (name) {
    this.name = name; 
    this.participants = []; 

    this.computeDates = function () {
        //create variables to compare and get the minimum and maximum
        var warStartDate = new ODate(2010, 0, 0);
        var warEndDate = new ODate(1700, 0, 0);

        //go to the list of participants and get the max date and minimum
        for (var i = 0; i < this.participants.length; i++) {
            var p = this.participants[i];
            warStartDate = p.startDate.min(warStartDate);
            warEndDate = p.endDate.max(warEndDate);
        }

        this.warStartDate = warStartDate;
        this.warEndDate = warEndDate;
    }

}

var Participant = function (country, startDate, endDate, side) {
    this.country = country;
    this.startDate = startDate;
    this.endDate = endDate;
    this.side = side;
}



var ODate = function (AAAA, MM, DD) {
    this.year = AAAA;
    this.month = MM;
    this.day = DD;

    this.min = function (otherdate) {
        if (getDecimalDate(otherdate) < getDecimalDate(this)) {
            return otherdate;
        } else {
            return this;
        }
    }

    this.max = function (otherdate) {
        if (getDecimalDate(otherdate) > getDecimalDate(this)) {
            return otherdate;
        } else {
            return this;
        }
    }
}

function getDecimalDate(date) {
    return date.year + (date.month - 1) / 12 + (date.day - 1) / 365;
}

//+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+


/* SET UP FUNCTION */
function setup() {
    var canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('holder');
    frameRate(20);
    strokeCap(ROUND);

    colorMode(HSB, 360, 100, 100, 100);
    //strokeCape(SQUARE)

    table.getRows().forEach(function (row) {
        var warName = row.getString("WarName");
        //print(warName);
        var countryName = row.getString("StateName");
        var participantName = row.getString("StateName");
        var startYear = int(row.getString("StartYear1"));
        var startMonth = int(row.getString("StartMonth1"));
        var startDay = int(row.getString("StartDay1"));
        var endYear = int(row.getString("EndYear1"));
        var endMonth = int(row.getString("EndMonth1"));
        var endDay = int(row.getString("EndDay1"));
        var side = int(row.getString("Side"));
        //var initiator = int()

        var startDate = new ODate(startYear, startMonth, startDay);
        var endDate = new ODate(endYear, endMonth, endDay);

        var participant = new Participant(participantName, startDate, endDate, side);

        var war = getWar(warName); //getWar is a global function


        if (war == "false") {
            //create a new war
            var myWar = new War(warName);
            myWar.participants.push(participant);
            wars.push(myWar); //"wars" is the collection of all wars
        } else {
            //fill the existing war with new data
            war.participants.push(participant);
        }


    });

    //print(wars);

    wars.forEach(function (w) {
        w.computeDates();
    });

    //print(wars);

    countries.features.forEach(function (feature) {
        var name = feature.properties.name;
        var myPolygon = [];
        //print("From feature: "+name);
        if (feature.geometry != null) {
            if (feature.geometry.type == "Polygon") {
                myPolygon.push(feature.geometry.coordinates[0]);
            } else if (feature.geometry.type == "MultiPolygon") {
                myPolygon.push(feature.geometry.coordinates[0][0]);
                // above is relevant to the structure of json 
            }
        }

        var c = new Country(name, myPolygon);
        countriesMap.push(c);
    });

    //print(countriesMap);

    sliderValuePrevious = document.getElementById("myRange").value;

    var atL = new Attractor(createVector(width * .275, height * .4), 84);
    attractors.push(atL);

    var atR = new Attractor(createVector(width * .9, height * .4), 84);
    attractors.push(atR);
}

/*Search for a war with this name in the array*/
function getWar(name) {
    for (var i = 0; i < wars.length; i++) {
        var war = wars[i];
        if (war.name == name) {
            return war;
        }
    }
    return "false";
}

function getCountry(name) {
    for (var i = 0; i < countriesMap.length; i++) {
        var country = countriesMap[i];
        if (country.name == name) {
            return country;
        }
    }
    print("FALSE " + name);
    return "false";
}




/* DRAW FUNCTION */
function draw() {
    background('#444444');



    //slider
    /*THE SLIDER*/
    var sliderValue = document.getElementById("myRange").value;


    if (sliderValue != sliderValuePrevious) {
        yearToDisplay = int(map(sliderValue, 0, 100, 1823, 2003));
        //print(yearToDisplay);

        updateCountriesToDisplay();
        sliderValuePrevious = sliderValue;
    };


    //Here we draw countriesMap
    countriesMap.forEach(function (c) {
        var center = mercator(c.center.y, c.center.x);

        push();
        translate(center.x, center.y);
        scale(0.5);

        c.polygon.forEach(function (path) {

            fill('#1a1a1a');
            //stroke('#737373');
            strokeWeight(0.5);

            beginShape();
            path.forEach(function (vertice) {
                var m = mercator(vertice[1], vertice[0]);
                vertex(1 * (m.x - center.x), 1 * (m.y - center.y));
            });
            endShape();

        });

        pop();

        var center = getCentroid(c.polygon);

        center = mercator(center.y, center.x);
    });

    countriesToDisplay.forEach(function (c) {
        var center = mercator(c.center.y, c.center.x);

        push();
        translate(center.x, center.y);
        scale(0.5);

        c.polygon.forEach(function (path) {

            fill(random(25, 35), 80, 100, 60);
            noStroke();

            beginShape();
            path.forEach(function (vertice) {
                var m = mercator(vertice[1], vertice[0]);
                vertex(1 * (m.x - center.x), 1 * (m.y - center.y));
            });
            endShape();

        });

        pop(); 
        var center = getCentroid(c.polygon);

        center = mercator(center.y, center.x);

    });




    var y = 0;
    wars.forEach(function (war) {
        war.participants.forEach(function (participant) {});
    });

    noStroke();
    fill('#d1722e');
    textFont(verdana);
    textSize(16);
    text(yearToDisplay, windowWidth / 2 + 30, windowHeight / 1.2)

    //noLoop(); //can't add noloop here or the yeartodisplay stops 

    //+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~ ARC HERE +~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+
    
    countriesToDisplay.forEach(function (c) {
        var particleSystem = c.particleSystem;
        noFill();
        strokeWeight(1);
    
        noStroke();
        for (var i = particleSystem.length - 1; i >= 0; i--) {
            var p = particleSystem[i];
            if (p.areYouDeadYet()) {

                particleSystem.splice(i, 1);
            } else {

                p.update();
                p.draw();
                
            }
        }
        

    });

    //+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~ ARC HERE +~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+


    attractors.forEach(function (at) {
        at.draw();
    });

    attractorsC.forEach(function (atC) {
        atC.draw();
    });
    
    createArcs();
}

/* GET AREA */
function getArea(mypolygon) {
    var area = 0,
        numPoints = mypolygon[0].length;
    for (var i = 0; i < numPoints; i++) {

        var a = mypolygon[0][i];
        var b = mypolygon[0][(i + 1) % numPoints]; // % means remainder

        area += a[0] * b[1];
        area -= a[1] * b[0];
    }
    area *= 0.5;
    return area;
} // THESE CODES COME FROM TOXICLIBSJS 

/* GET CENTROID */
function getCentroid(mypolygon) {
    var res = createVector(0, 0);
    var numPoints = mypolygon[0].length; // WHEN EVERYTHING SEEMS TO SETTLED DOWN THERE ALWAYS AN UNDEFINED PROBLEM
    for (var i = 0; i < numPoints; i++) {

        var a = mypolygon[0][i];
        var b = mypolygon[0][(i + 1) % numPoints];
        var factor = a[0] * b[1] - b[0] * a[1];

        res.x += (a[0] + b[0]) * factor;
        res.y += (a[1] + b[1]) * factor;
        //print(factor);
    }
    return res.mult(1 / (getArea(mypolygon) * 6));
} // THESE CODES COME FROM TOXICLIBSJS 



/* FILTER THE COUNTRIES BY YEAR */
function updateCountriesToDisplay() {

    countriesToDisplay = [];

    wars.forEach(function (w) {
        //if current date that I have selected is between w.startDate and w.endDate
        //get the name of the country
        //get the country
        //put it in the array countriesToDisplay if it-s not already there
        if (yearToDisplay <= w.warEndDate.year && yearToDisplay >= w.warStartDate.year) {
            w.participants.forEach(function (p) {
                var countryName = p.country;
                var country = getCountry(countryName);
                if (country != "false") {
                    var areYouThere = false;
                    countriesToDisplay.forEach(function (c) {
                        if (country == c) {
                            areYouThere = true;
                        }
                    });

                    if (!areYouThere) {
                        countriesToDisplay.push(country);
                        country.particleSystem = [];
                        
                    }
                }
            });
        }
    });
}

/* MERCATOR */
function mercator(lat, lon) {
    var scale = 150;
    var x = radians(lon);
    var y = log(tan(PI / 4 + radians(lat) / 2));
    x *= scale;
    y *= scale;
    x += width / 2;
    y = height / 2 - y;
    return createVector(x, y);
}

//+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~ ARC HERE +~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+
var Particle = function (position, velocity, hue, attractor) {
    var position = position.copy(); //position is a vector
    var velocity = velocity.copy();
    var acceleration = createVector(0, 1);
    this.size = 2;

    var initiallifeSpan = random(50, 80);
    this.lifeSpan = initiallifeSpan;


    this.hue = random(hue - 15, hue + 15);

    this.attractor = attractor;

    this.update = function () {

        //this part makes the line start at a position and end at a postions
        var att = p5.Vector.sub(this.attractor.getPos(), position);

        att.normalize();
        att.mult(this.attractor.getStrength());
        att.mult(0.1);


        velocity.add(att);
        position.add(velocity);
        velocity.limit(2);

        this.lifeSpan--;



    }


    this.draw = function () {

        stroke(this.hue, 100, 100);
        
        line(position.x, position.y,
            position.x - velocity.x, position.y - velocity.y);
       
    }

    this.areYouDeadYet = function () {

        var dist = position.dist(this.attractor.getPos());
        if (dist < 10) {
            this.lifeSpan = 0;
        }

        return this.lifeSpan <= 0;
    }

    this.getPos = function () {
        return position.copy();

    }
}



function createArcs() {

    countriesToDisplay.forEach(function (cd) {
        //search if it's side 1

        wars.forEach(function (ww) {

            if (yearToDisplay >= ww.warStartDate.year && yearToDisplay <= ww.warEndDate.year) {


                ww.participants.forEach(function (pp) {


                    if (cd.name == pp.country && pp.side == 1) {

                        ww.participants.forEach(function (pdes) {
                            if (pdes != pp) {
                                var countryDest = countriesToDisplay.find(function (ccc) {
                                    return ccc.name == pdes.country;

                                });

                                //NOW DRAW AN ARC FROM cd  TO countryDest
                                if (countryDest) {
                                    arc(cd, countryDest);
                                
                                   
                                }

                            }
                        });
                    }
                });
            }
        });
    });


    function arc(originCountry, destCountry) {
        var hue = random(20, 40);
        var saturation = random(0, 10);

        var centerDest = mercator(destCountry.center.y, destCountry.center.x);

        var centerOr = mercator(originCountry.center.y, originCountry.center.x);


        var attractor = new Attractor(createVector(centerDest.x, centerDest.y), 2);
        var pos = centerOr;

        var dir = p5.Vector.sub(attractor.getPos(), pos).copy();

        dir.rotate(HALF_PI);
        dir.normalize();
        var vel = dir.mult(random(2, 7));

            var newBorn = new Particle(pos, vel.copy(), hue, attractor);
            var maybe = random(1, 10);
            maybe = int(maybe);
            if(frameCount % maybe == 0)
                originCountry.particleSystem.push(newBorn)
    }

    
}

var Attractor = function (pos, s) {
    this.pos = pos.copy();
    var strength = s * 10;
    this.draw = function () {
        noStroke();
        fill(100, 0, 0, 0);
        ellipse(this.pos.x, this.pos.y, strength, strength);
    }

    this.getPos = function () {
        return this.pos.copy();
    }

    this.getStrength = function () {
        return strength * 2;
    }

}

//+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~ ARC HERE +~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+

/* FORMAT */
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}