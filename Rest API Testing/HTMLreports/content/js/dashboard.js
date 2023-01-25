/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 25.0, "KoPercent": 75.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.125, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, "GET Request - Get Users"], "isController": false}, {"data": [0.0, 500, 1500, "DELETE Request - Delete User"], "isController": false}, {"data": [0.0, 500, 1500, "PUT Request - Update User"], "isController": false}, {"data": [0.5, 500, 1500, "POST Request - Create User"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 40, 30, 75.0, 3533.35, 602, 5190, 4305.0, 5009.7, 5186.349999999999, 5190.0, 2.757479663587481, 2.5388201433889424, 0.52308635219909], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["GET Request - Get Users", 10, 10, 100.0, 4853.2, 4422, 5190, 4866.5, 5190.0, 5190.0, 5190.0, 1.9264110961279137, 3.288443941437103, 0.2389201261799268], "isController": false}, {"data": ["DELETE Request - Delete User", 10, 10, 100.0, 4532.0, 4501, 4548, 4538.5, 4547.5, 4548.0, 4548.0, 2.176278563656148, 1.3100176822633298, 0.44205658324265507], "isController": false}, {"data": ["PUT Request - Update User", 10, 10, 100.0, 4130.7, 4047, 4188, 4140.5, 4185.9, 4188.0, 4188.0, 2.3792529145848205, 1.610642695693552, 0.5227850642398286], "isController": false}, {"data": ["POST Request - Create User", 10, 0, 0.0, 617.5, 602, 710, 608.5, 700.2, 710.0, 710.0, 14.084507042253522, 9.815140845070424, 2.984705105633803], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["The operation lasted too long: It took 4,501 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,114 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,620 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,143 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 5,190 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 2, 6.666666666666667, 5.0], "isController": false}, {"data": ["The operation lasted too long: It took 4,422 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,150 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,535 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,148 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,188 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,542 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,047 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,517 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 5,117 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,167 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,138 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,514 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,521 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,719 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,543 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 2, 6.666666666666667, 5.0], "isController": false}, {"data": ["The operation lasted too long: It took 4,816 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 5,020 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,096 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,116 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,917 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,540 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,537 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 4,548 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 3.3333333333333335, 2.5], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 40, 30, "The operation lasted too long: It took 5,190 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 2, "The operation lasted too long: It took 4,543 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 2, "The operation lasted too long: It took 4,501 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 4,114 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 4,620 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["GET Request - Get Users", 10, 10, "The operation lasted too long: It took 5,190 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 2, "The operation lasted too long: It took 4,816 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 5,020 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 5,117 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 4,620 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1], "isController": false}, {"data": ["DELETE Request - Delete User", 10, 10, "The operation lasted too long: It took 4,543 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 2, "The operation lasted too long: It took 4,535 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 4,501 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 4,542 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 4,517 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1], "isController": false}, {"data": ["PUT Request - Update User", 10, 10, "The operation lasted too long: It took 4,150 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 4,114 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 4,167 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 4,138 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 4,143 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
