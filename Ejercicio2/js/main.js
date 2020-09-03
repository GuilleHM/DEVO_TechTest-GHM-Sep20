/**
 * Gets data in json format from three data sources (using 'axios' library). Then:
 * 
 * - Normalizes each data point into an object with format: {d: <ts in ms>, cat: "CAT <x>", val: <num>}.
 * - Joins all objects into an unique object array.
 * - Merges objects with same date ("d") and category ("cat"), summing their "val" properties up.
 * - Groups objects by "cat".
 * 
 * Finally, renders data array into a Graph Line and a Pie Chart (using highcharts library).
 */


const url_one = 'http://s3.amazonaws.com/logtrust-static/test/test/data1.json';
const url_two = 'http://s3.amazonaws.com/logtrust-static/test/test/data2.json';
const url_three = 'http://s3.amazonaws.com/logtrust-static/test/test/data3.json';


// Fetch data from the three sources and wait for all promises resolution
axios.all([axios.get(url_one), axios.get(url_two), axios.get(url_three)]).then(axios.spread((responseOne, responseTwo, responseThree) => {

    // Normalize data for the three reponse objects.
    responseOne.data.forEach(item => {
        item.cat = item.cat.toUpperCase();
        item.val = item.value;
        delete item.value;
    });

    responseTwo.data.forEach(item => {
        item.d = new Date(item.myDate).getTime(); // YYYY-MM-DD to TimeStamp
        delete item.myDate;
        item.cat = item.categ;
        delete item.categ;
    });

    responseThree.data.forEach(item => {
        // Parse dates since 1600, considering leap years
        item.d = new Date(item.raw.match(/\b(((?:(?:1[6-9]|[2-9]\d)?\d{2})(-)(?:(?:(?:0?[13578]|1[02])(-)31)|(?:(?:0?[1,3-9]|1[0-2])(-)(?:29|30))))|(((?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))(-)(?:0?2(-)29))|((?:(?:(?:1[6-9]|[2-9]\d)?\d{2})(-)(?:(?:0?[1-9])|(?:1[0-2]))(-)(?:0[1-9]|1\d|2[0-8]))))\b/)[0]).getTime();
        item.cat = item.raw.match(/(#.*?#)/)[0].replace(/#/g, '');
        delete item.raw;
    });

    // Join normalized responses into an array of objects
    // Sort objects by date & category
    // Merge (summing their values up) objects with same date & category
    // Group objects by category
    // Resulting array to be used for rendering Line Graph and Pie Chart
    const byCategoryArray = [...responseOne.data, ...responseTwo.data, ...responseThree.data]
        .sort((a, b) => {
            if (a.d < b.d) return -1;
            else if (a.d > b.d) return 1;
            else {
                if (a.cat < b.cat) return -1;
                if (a.cat > b.cat) return 1;
                return 0;
            }
        })
        .reduce((acc, cur, index, arr) => {
            if (cur.d === acc[acc.length - 1].d && cur.cat === acc[acc.length - 1].cat) {
                acc[acc.length - 1].val += cur.val;
            }
            else acc.push(cur);
            acc[0].val += cur.val // Add to TOTAL
            return acc;
        }, [{ d: 0, cat: "TOTAL", val: 0 }]) // Initial total sum of values
        .reduce((acc, cur, index, array) => {
            var idx = cur["cat"];
            if (!acc[idx]) {
                acc[idx] = array.filter(item => item["cat"] === idx);
                acc[idx].push(acc[idx].reduce((acc, cur) => acc + cur.val, 0)); // Category Subtotal
            }
            return acc;
        }, {});

    // Render graphs
    // ------------------- LineGraph ---------------------------

    Highcharts.chart('lineGraph', {
        chart: {
            type: 'line'
        },
        title: {
            text: 'Ejercicio2 - Line Graph'
        },
        subtitle: {
            text: 'Daily Time Series. Source: DEVO'
        },
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: {
                month: '%e. %b',
                year: '%b'
            },
            title: {
                text: 'Date'
            }
        },
        tooltip: {
            headerFormat: '<b>{series.name}</b><br>',
            pointFormat: '{point.x:%e. %b}: {point.y:.2f} m'
        },
        plotOptions: {
            series: {
                marker: {
                    enabled: true
                }
            }
        },
        // Colors harcoded for up to 5 data series
        colors: ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#68217a'],

        // Define the data points
        series: Object.entries(byCategoryArray).flatMap(item => {
            let rObj = {}
            if (item[0] === "TOTAL") return []
            rObj["name"] = item[0]
            rObj["data"] = item[1].map(item => [item.d, item.val])
            rObj["data"].pop() // Remove Subtotal item
            return rObj
        }),
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 500
                },
                chartOptions: {
                    plotOptions: {
                        series: {
                            marker: {
                                radius: 2.5
                            }
                        }
                    }
                }
            }]
        }
    });

    // ------------------- PieChart ---------------------------

    Highcharts.chart('pieChart', {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },
        title: {
            text: 'Ejercicio2 - Pie Chart'
        },
        subtitle: {
            text: 'Accumulated Value Proportions'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        accessibility: {
            point: {
                valueSuffix: '%'
            }
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                }
            }
        },
        series: [{
            name: 'Categories',
            colorByPoint: true,
            data: Object.entries(byCategoryArray).flatMap(item => {
                let rObj = {}
                if (item[0] === "TOTAL") return [];
                rObj["name"] = item[0];
                rObj["y"] = item[1][item[1].length - 1] / byCategoryArray.TOTAL[1] * 100;
                if (item[0] === "CAT 1") {
                    rObj["sliced"] = true;
                    rObj["selected"] = true;
                }
                return rObj
            }),
        }]
    });

})).catch(error => {
    console.log(error.message)
});
