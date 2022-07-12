import Highcharts from "highcharts";
import more from "highcharts/highcharts-more";
import annotations from "highcharts/modules/annotations";
import xrange from "highcharts/modules/xrange";
import boost from "highcharts/modules/boost";

more(Highcharts);
xrange(Highcharts);
annotations(Highcharts);
boost(Highcharts);

export default Highcharts;
