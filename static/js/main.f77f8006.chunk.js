(this.webpackJsonptools=this.webpackJsonptools||[]).push([[0],{182:function(e,t,a){e.exports=a.p+"static/media/ufrgs-inf.1abd8f9e.png"},183:function(e,t,a){e.exports=a.p+"static/media/ufrgs.6440c8a1.png"},220:function(e,t,a){e.exports=a(352)},225:function(e,t,a){},226:function(e,t,a){},227:function(e,t,a){},351:function(e,t,a){},352:function(e,t,a){"use strict";a.r(t);var n=a(0),r=a.n(n),c=a(46),o=a.n(c),l=(a(225),a(367)),i=(a(226),a(182)),u=a.n(i),s=a(183),m=a.n(s),C=a(68),d=a(19),f=a(39),h=a(371),v=a(372),b=a(365),p=a(373),y=a(363),g=a(362),H=a(369),O=a(368),V=a(202),E=a(59),j={chartType:"heatmap",metric:"cases",showDataLabels:!1,isCumulative:!0,title:"Timeline Plots of Coronavirus Data",dayInterval:30,selectedCountries:{},alignAt:0},M=[{name:"ECDC",url:"https://www.ecdc.europa.eu/en/publications-data/download-todays-data-geographic-distribution-covid-19-cases-worldwide"},{name:"Brasil.IO",url:"https://brasil.io/dataset/covid19/caso"},{name:"PHAS",url:"https://www.folkhalsomyndigheten.se/smittskydd-beredskap/utbrott/aktuella-utbrott/covid-19/aktuellt-epidemiologiskt-lage"},{name:"NY Times",url:"https://github.com/nytimes/covid-19-data"},{name:"ISC",url:"https://covid19.isciii.es/"},{name:"PHE",url:"https://www.gov.uk/government/publications/covid-19-track-coronavirus-cases"}],w=(a(227),a(92)),S=a(203),L=a(93),Z=a.n(L),k=a(374),I=a(102);function x(){var e=Object(n.useState)({}),t=Object(d.a)(e,2),a=t[0],r=t[1],c=Object(n.useState)(!0),o=Object(d.a)(c,2),l=o[0],i=o[1];return Object(n.useEffect)((function(){var e=!1;return fetch("https://raw.githubusercontent.com/inf-covid19/covid19-data/master/data/metadata.json").then((function(e){return e.json()})).then((function(t){e||(localStorage.setItem("covid19-tools.metadata.cacheV2",JSON.stringify(t)),r(t))})).catch((function(e){console.warn("Unable to fetch metadata.",e)})).finally((function(){i(!1)})),function(){e=!0}}),[]),Object(n.useMemo)((function(){return{data:a,loading:l}}),[a,l])}var D=a(21),F=a.n(D),N="covid19-tools.api.cacheV2";var R=function(){try{var e=localStorage.getItem(N);if(e)return JSON.parse(e)}catch(t){return{}}return{}}(),A=function(e){return"".concat(N,".").concat(e)},P=function(e,t){if(R.hasOwnProperty(e)&&Object(k.a)(new Date,new Date(R[e].created_at))<2){var a=localStorage.getItem(A(e));if(a)return Promise.resolve(JSON.parse(a))}return t().then((function(t){return R[e]={created_at:(new Date).toISOString()},localStorage.setItem(A(e),JSON.stringify(t)),t}),(function(t){if(localStorage.hasOwnProperty(A(e))){var a=localStorage.getItem(A(e));if(a)return Promise.resolve(JSON.parse(a))}return Promise.reject(t)})).finally((function(){localStorage.setItem(N,JSON.stringify(R))}))};function T(e){var t=Object(n.useState)(null),a=Object(d.a)(t,2),r=a[0],c=a[1],o=Object(n.useState)(!0),l=Object(d.a)(o,2),i=l[0],u=l[1],s=Object(n.useState)(null),m=Object(d.a)(s,2),f=m[0],h=m[1],v=Object(n.useMemo)((function(){return Z()(e).join("|")}),[e]);return Object(n.useEffect)((function(){var t=!1;return h(null),c(null),u(!0),Promise.all(e.map((function(e){return function(e){var t=JSON.parse(localStorage.getItem("covid19-tools.metadata.cacheV2")||"{}"),a=F()(t,e);if(a&&a.parent){var n=e.split(".");e=[].concat(Object(C.a)(n.slice(0,n.length-1)),[a.parent]).join(".")}return P(e,(function(){return Object(I.a)("https://raw.githubusercontent.com/inf-covid19/covid19-data/master/".concat(F()(t,e).file,"?v=2"))}))}(e)}))).then((function(a){if(!t){var n={};a.forEach((function(t,a){n[e[a]]=t})),c(n)}})).catch((function(e){t||h(e)})).finally((function(){t||u(!1)})),function(){t=!0}}),[v]),Object(n.useMemo)((function(){return{data:r,loading:i,error:f}}),[r,i,f])}var J=a(360),_=a(375),U=a(366),B=a(131),z=a(370),G=a(184),W=a.n(G),K=a(57),Y=a.n(K),$=a(94),q=a.n($),Q=a(185),X=a.n(Q),ee=a(361),te=a(186),ae=a.n(te),ne=function(e){return ae()(e).format("Oo")},re=I.b(".2s"),ce={state:"state",city:"city",autonomous_community:"region",country:"region",county:"county",nhsr:"region",utla:"region",health_board:"region",lgd:"region"},oe={Brazil:{date:{name:"date",format:"yyyy-MM-dd"},metric:{cases:"confirmed",deaths:"deaths"}},Spain:{date:{name:"date",format:"yyyy-MM-dd"},metric:{cases:"cases",deaths:"deaths"}},United_Kingdom:{date:{name:"date",format:"yyyy-MM-dd"},metric:{cases:"cases",deaths:"deaths"}},United_States_of_America:{date:{name:"date",format:"yyyy-MM-dd"},metric:{cases:"cases",deaths:"deaths"}},Sweden:{date:{name:"date",format:"yyyy-MM-dd"},metric:{cases:"cases",deaths:"deaths"}},Default:{date:{name:"dateRep",format:"dd/MM/yyyy"},metric:{cases:"cases",deaths:"deaths"}}};var le=r.a.forwardRef((function(e,t){var a=e.chartType,c=void 0===a?"heatmap":a,o=e.title,i=e.metric,u=e.showDataLabels,s=e.isCumulative,m=e.dayInterval,C=e.selectedCountries,h=e.alignAt,v=void 0===h?0:h,b=Object(S.a)(e,["chartType","title","metric","showDataLabels","isCumulative","dayInterval","selectedCountries","alignAt"]),p=Object(n.useMemo)((function(){return Object(J.a)({start:Object(_.a)(new Date,m),end:new Date})}),[m]),y=T(Object(n.useMemo)((function(){return Object.keys(C)}),[C])),g=y.data,H=y.loading,O=Object(n.useMemo)((function(){return H||!g?[]:Object.entries(g).map((function(e){var t=Object(d.a)(e,2),a=t[0],n=t[1],r=q()(a.split(".")),c=a.indexOf(".")>-1,o=c&&oe.hasOwnProperty(r)?oe[r]:oe.Default;if(c){var u=Y()(a.split("."));n=n.filter((function(e){return e[ce[e.place_type]]===u}))}n=W()(n,(function(e){return Object(U.a)(e[o.date.name],o.date.format,Object(B.a)(new Date))}),"desc");var m=0;if(v>0){var C,h=n.reduceRight((function(e,t){var a=Object(U.a)(t[o.date.name],o.date.format,Object(B.a)(new Date)),n=parseInt(t[o.metric[i]]||"0"),r=n;if(c&&(r=n-m),C&&Object(z.a)(a,C)>1){var l=Object(J.a)({start:C,end:a});l.slice(1,l.length-1).forEach((function(){e.push({total:m})}))}return m+=r,e.push(Object(f.a)({},t,{total:m})),C=a,e}),[]);return{name:Y()(a.split(".")),key:a,data:h.filter((function(e){return e.total>=v})).map((function(e,t){return{x:t+1,y:s?e.total:e[i]}}))}}var b=n.reduceRight((function(e,t){var a=parseInt(t[o.metric[i]]||"0"),n=t[o.date.name],r=a;if(c){if(a-m===0)return e;r=a-m}return m+=r,e[n]=Object(f.a)({},t,Object(w.a)({},i,s?m:r)),e}),{}),y=0,g=p.map((function(e){var t=b[Object(l.a)(e,o.date.format)],a={x:e.getTime(),y:t?t[i]:s?y:0};return y=a.y,a}));return{name:Y()(a.split(".")),key:a,data:g}}))}),[g,H,p,s,i,v]),V=Object(n.useMemo)((function(){return Z()(O.filter((function(e){return!!C[e.key]})),(function(e){var t;return null===(t=Y()(e.data))||void 0===t?void 0:t.y}))}),[O,C]),E=Object(n.useMemo)((function(){return{chart:{toolbar:{tools:{download:!0,selection:!1,zoom:!1,zoomin:!1,zoomout:!1,pan:!1,reset:!1}}},tooltip:{y:{formatter:function(e){return"".concat(e," ").concat(i)}},x:{formatter:v>0?function(e){return"".concat(ne(e)," day after ").concat(v>=1e3?re(v):v," ").concat(i)}:void 0}},xaxis:{type:0===v?"datetime":"numeric",labels:{formatter:v>0?ne:void 0}},dataLabels:{enabled:u,formatter:function(e){return e>=1e3?re(e):e}},title:{text:o,style:{fontSize:"20px",fontFamily:"Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif"}},subtitle:{text:"".concat(s?"Total":"Daily"," number of ").concat(i),floating:!0,style:{fontSize:"14px",fontFamily:"Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif"}},plotOptions:{heatmap:{shadeIntensity:0,colorScale:{ranges:[{from:0,to:10,name:"0-10",color:"#ffffd9",foreColor:"#0d0d0d"},{from:11,to:50,name:"11-50",color:"#edf8b1",foreColor:"#0d0d0d"},{from:51,to:100,name:"51-100",color:"#c7e9b4",foreColor:"#0d0d0d"},{from:101,to:250,name:"101-250",color:"#7fcdbb"},{from:251,to:500,name:"251-500",color:"#41b6c4"},{from:501,to:1e3,name:"501-1000",color:"#1d91c0"},{from:1001,to:5e3,name:"1001-5000",color:"#225ea8"},{from:5001,to:1e4,name:"5001-10000",color:"#253494"},{from:10001,to:999999,name:"> 10000",color:"#081d58"}]}}}}}),[o,i,s,u,v]);return H?r.a.createElement("div",{style:{height:e.height,display:"flex",justifyContent:"center",alignItems:"center"}},r.a.createElement(ee.a,{active:!0,inline:!0})):r.a.createElement(X.a,Object.assign({key:c,ref:t,options:E,series:V,type:c},b))})),ie="covid19-tools.editor.savedCharts",ue="covid19-tools.editor.defaults";var se=function(){var e=Object(f.a)({},j,{selectedCountries:{}});if(localStorage.hasOwnProperty(ue)){var t=localStorage.getItem(ue);if(t){var a=JSON.parse(t);return Object(f.a)({},e,{},a)}}return e}();var me=function(){var e=Object(n.useState)(function(){if(localStorage.hasOwnProperty(ie)){var e=localStorage.getItem(ie);if(e)return JSON.parse(e)}return[]}()),t=Object(d.a)(e,2),a=t[0],c=t[1],o=Object(n.useRef)(null),l=Object(n.useState)(se.chartType),i=Object(d.a)(l,2),u=i[0],s=i[1],m=Object(n.useState)(se.metric),j=Object(d.a)(m,2),M=j[0],w=j[1],S=Object(n.useState)(se.alignAt),L=Object(d.a)(S,2),Z=L[0],k=L[1],I=Object(n.useState)(se.isCumulative),D=Object(d.a)(I,2),F=D[0],N=D[1],R=Object(n.useState)(se.showDataLabels),A=Object(d.a)(R,2),P=A[0],T=A[1],J=Object(n.useState)(se.title),_=Object(d.a)(J,2),U=_[0],B=_[1],z=Object(n.useState)(se.dayInterval),G=Object(d.a)(z,2),W=G[0],K=G[1],Y=Object(n.useState)(se.selectedCountries),$=Object(d.a)(Y,2),q=$[0],Q=$[1],X=Object(n.useState)(!1),ee=Object(d.a)(X,2),te=ee[0],ae=ee[1],ne=x().data,re=Object.entries(ne).flatMap((function(e){var t=Object(d.a)(e,2),a=t[0],n=t[1],r=n.name.replace(/_/g," ");return[{key:a,value:a,text:r}].concat(Object(C.a)(Object.entries(n.regions).map((function(e){var t=Object(d.a)(e,2),n=t[0],c=t[1];return{key:"".concat(a,".regions.").concat(n),text:"".concat(c.name).concat(c.parent?", ".concat(c.parent):"",", ").concat(r),value:"".concat(a,".regions.").concat(n)}}))))})),ce=Object(n.useMemo)((function(){return Object.keys(q).filter((function(e){return q[e]}))}),[q]);return Object(n.useEffect)((function(){localStorage.setItem(ie,JSON.stringify(a))}),[a]),Object(n.useEffect)((function(){localStorage.setItem(ue,JSON.stringify({metric:M,isCumulative:F,showDataLabels:P,title:U,dayInterval:W,selectedCountries:q,alignAt:Z,chartType:u}))}),[M,F,P,U,W,q,Z,u]),Object(n.useEffect)((function(){var e=!1;return te&&setTimeout((function(){e||ae(!1)}),3e3),function(){e=!0}}),[te]),r.a.createElement("div",null,r.a.createElement(h.a,{padded:!0},r.a.createElement(h.a.Row,null,r.a.createElement(h.a.Column,{width:12},r.a.createElement(v.a,null,r.a.createElement(le,{ref:o,chartType:u,height:600,isCumulative:F,title:U,metric:M,showDataLabels:P,dayInterval:W,selectedCountries:q,alignAt:Z}))),r.a.createElement(h.a.Column,{width:4},r.a.createElement(v.a,{style:{height:"100%"}},r.a.createElement(b.a,null,r.a.createElement(p.a,null,"Options"),r.a.createElement(b.a.Field,null,r.a.createElement("label",null,"Title"),r.a.createElement("input",{placeholder:"Enter a title",type:"text",defaultValue:U,onBlur:function(e){var t=e.target;return B(t.value)}})),r.a.createElement(b.a.Select,{label:"Choose chart type",value:u,onChange:function(e,t){var a=t.value;return s(a)},options:[{key:"heatmap",text:"Heatmap",value:"heatmap"},{key:"line",text:"Line",value:"line"},{key:"area",text:"Area",value:"area"},{key:"bar",text:"Bar",value:"bar"}]}),r.a.createElement(b.a.Select,{label:"Choose total or daily values",value:F?"total":"daily",onChange:function(e,t){var a=t.value;return N("total"===a)},options:[{key:"total",text:"Total",value:"total"},{key:"daily",text:"Daily",value:"daily"}]}),r.a.createElement(b.a.Select,{label:"Choose cases or deaths",value:M,onChange:function(e,t){var a=t.value;return w(a)},options:[{key:"cases",text:"Cases",value:"cases"},{key:"deaths",text:"Deaths",value:"deaths"}]}),r.a.createElement(b.a.Field,null,r.a.createElement("label",null,"Minimum number of ",M," to align timeline"),r.a.createElement("input",{type:"number",placeholder:"Enter a number",min:"0",defaultValue:Z,onBlur:function(e){var t=e.target;return k(parseInt(t.value)||0)}})),r.a.createElement(b.a.Field,{disabled:Z>0},r.a.createElement("label",null,"How many past days would you like to see?"),r.a.createElement("input",{type:"number",placeholder:"Enter a number",min:"0",defaultValue:W,onBlur:function(e){var t=e.target;return K(parseInt(t.value)||W)}})),r.a.createElement(b.a.Field,{control:y.a,searchInput:{id:"editor-countries-select"},clearable:!0,label:{children:"Choose countries (click to add more)",htmlFor:"editor-countries-select"},value:ce,onChange:function(e,t){var a=t.value;return Q((function(e){var t=Object(f.a)({},e),n=Object.fromEntries(a.map((function(e){return[e,!0]})));return Object.keys(Object(f.a)({},t,{},n)).forEach((function(e){t[e]=n[e]||!1})),t}))},search:!0,multiple:!0,options:re}),r.a.createElement(b.a.Field,null,r.a.createElement(g.a,{toggle:!0,checked:P,onChange:function(){return T(!P)},label:"Show data labels"})),r.a.createElement(H.a,{positive:te,onClick:function(){var e;null===(e=o.current)||void 0===e||e.chart.dataURI().then((function(e){var t=e.imgURI,n=[].concat(Object(C.a)(a),[{dataURI:t,alignAt:Z,metric:M,title:U,isCumulative:F,selectedCountries:q,dayInterval:W,showDataLabels:P,chartType:u}]);c(n),ae(!0)}))}},te?"Saved":"Save"))))),r.a.createElement(h.a.Row,null,r.a.createElement(h.a.Column,{width:16},r.a.createElement(v.a,{placeholder:0===a.length},a.length>0?r.a.createElement(n.Fragment,null,r.a.createElement(p.a,{as:"h3"},"Saved Charts"),r.a.createElement("div",{className:"Editor--saved-charts--container"},a.map((function(e,t){return r.a.createElement(O.a,{key:"".concat(t,"-").concat(e.title),className:"Editor--saved-charts--container--card"},r.a.createElement(V.a,{className:"Editor--saved-charts--container--card--image",alt:e.title,wrapped:!0,ui:!1,src:e.dataURI}),r.a.createElement(O.a.Content,null,r.a.createElement(O.a.Header,null,e.title),r.a.createElement(O.a.Meta,null,"".concat(e.isCumulative?"Total":"Daily"," number of ").concat(e.metric))),r.a.createElement(O.a.Content,{extra:!0},r.a.createElement("span",{className:"right floated"},"Past ",e.dayInterval," days"),r.a.createElement(E.a,{name:"map marker"}),"".concat(Object.keys(e.selectedCountries).filter((function(t){return e.selectedCountries[t]})).length," regions")),r.a.createElement(H.a.Group,{widths:"2",attached:"bottom"},r.a.createElement(H.a,{primary:!0,onClick:function(){w(e.metric),N(e.isCumulative),T(e.showDataLabels),B(e.title),K(e.dayInterval),Q(e.selectedCountries),k(e.alignAt||0),s(e.chartType||"heatmap"),window.scrollTo(0,0)}},"Load"),r.a.createElement(H.a,{onClick:function(){c(a.filter((function(e,a){return t!==a})))}},"Remove")))})))):r.a.createElement(p.a,{icon:!0},r.a.createElement(E.a,{name:"save outline"}),"No charts were saved yet."))))))};function Ce(){return(Ce=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var a=arguments[t];for(var n in a)Object.prototype.hasOwnProperty.call(a,n)&&(e[n]=a[n])}return e}).apply(this,arguments)}function de(e,t){if(null==e)return{};var a,n,r=function(e,t){if(null==e)return{};var a,n,r={},c=Object.keys(e);for(n=0;n<c.length;n++)a=c[n],t.indexOf(a)>=0||(r[a]=e[a]);return r}(e,t);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);for(n=0;n<c.length;n++)a=c[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(r[a]=e[a])}return r}var fe=r.a.createElement("path",{d:"M686.861 340.206C691.368 340.206 694.898 338.647 697.437 335.524C699.982 332.379 701.252 328.025 701.252 322.455C701.252 316.772 699.982 312.321 697.437 309.106C694.898 305.891 691.37 304.284 686.861 304.284C682.374 304.284 678.861 305.891 676.318 309.106C673.778 312.321 672.503 316.772 672.503 322.455C672.503 328.025 673.762 332.379 676.279 335.524C678.824 338.648 682.352 340.206 686.861 340.206ZM686.861 349.33C679.087 349.33 672.912 346.916 668.329 342.092C663.751 337.271 661.46 330.75 661.46 322.524C661.46 314.137 663.751 307.486 668.329 302.573C672.912 297.632 679.087 295.164 686.861 295.164C694.678 295.164 700.869 297.632 705.425 302.573C710.008 307.486 712.294 314.137 712.294 322.524C712.294 330.75 710.008 337.271 705.425 342.092C700.869 346.916 694.678 349.33 686.861 349.33ZM630.193 347.933V305.682H614.215V296.564H657.214V305.682H641.236V347.933H630.193ZM607.923 328.572C607.945 335.911 606.277 341.212 602.92 344.47C599.585 347.711 594.141 349.33 586.588 349.33C579.342 349.33 573.968 347.641 570.466 344.259C566.992 340.861 565.237 335.63 565.217 328.572V296.563H576.261V328.922C576.261 332.605 577.111 335.363 578.816 337.202C580.543 339.046 583.136 339.965 586.59 339.965C590.281 339.965 592.922 339.127 594.503 337.448C596.084 335.751 596.881 332.906 596.881 328.923V296.563H607.926V328.572H607.923ZM531.899 347.933V305.682H515.922V296.564H558.915V305.682H542.943V347.933H531.899ZM499.155 347.933V296.563H510.204V347.931H499.155V347.933ZM466.416 347.933V305.682H450.439V296.564H493.437V305.682H477.46V347.933H466.416ZM434.467 311.972C434.274 309.526 433.171 307.595 431.153 306.171C429.141 304.73 426.516 304.004 423.277 304.004C420.469 304.004 418.275 304.611 416.693 305.821C415.107 307.009 414.316 308.675 414.316 310.821C414.316 312.358 415.144 313.546 416.801 314.386C418.431 315.224 421.895 316.213 427.199 317.353C434.898 319.031 440.04 320.966 442.633 323.154C445.226 325.32 446.517 328.804 446.517 333.605C446.517 338.428 444.564 342.261 440.654 345.1C436.743 347.923 431.455 349.331 424.789 349.331C418.098 349.331 412.869 347.825 409.102 344.821C405.332 341.815 403.32 337.542 403.057 331.999H413.707C413.826 334.724 414.842 336.822 416.763 338.289C418.683 339.756 421.358 340.488 424.789 340.488C428.313 340.488 431.062 339.945 433.026 338.849C435.016 337.732 436.01 336.193 436.01 334.236C436.01 332.301 435.307 330.88 433.891 329.972C432.499 329.064 429.524 328.117 424.967 327.138C416.569 325.322 410.959 323.354 408.129 321.235C405.321 319.139 403.917 315.865 403.917 311.413C403.917 306.429 405.778 302.483 409.496 299.57C413.213 296.634 418.237 295.167 424.569 295.167C430.498 295.167 435.318 296.684 439.035 299.71C442.751 302.737 444.817 306.827 445.226 311.973H434.467V311.972ZM362.329 347.933H352V296.563H363.588L384.815 332.588V296.563H395.138V347.931H384.132L362.329 310.921V347.933ZM331.203 347.933V296.563H342.252V347.931H331.203",fill:"#7F7F7F"}),he=r.a.createElement("path",{d:"M937.634 380.694L930.619 401.349H944.687L937.634 380.694ZM912.664 420.639L931.374 369.271H944.183L962.93 420.639H951.197L947.635 410.188H927.559L924.068 420.639H912.664ZM908.35 402.64C907.678 408.58 905.279 413.301 901.151 416.795C897.051 420.29 891.824 422.038 885.464 422.038C878.03 422.038 872.118 419.624 867.728 414.801C863.36 409.978 861.176 403.458 861.176 395.232C861.176 386.844 863.36 380.194 867.728 375.281C872.118 370.34 878.029 367.872 885.464 367.872C891.747 367.872 896.955 369.522 901.081 372.834C905.207 376.119 907.628 380.581 908.348 386.215H897.266C896.905 383.446 895.669 381.243 893.56 379.613C891.473 377.978 888.811 377.168 885.572 377.168C881.472 377.168 878.256 378.764 875.932 381.953C873.603 385.125 872.441 389.528 872.441 395.163C872.441 400.662 873.592 404.974 875.894 408.093C878.219 411.195 881.446 412.743 885.572 412.743C888.811 412.743 891.473 411.835 893.56 410.018C895.669 408.202 896.907 405.745 897.266 402.643H908.35V402.64ZM842.219 420.639V369.271H853.264V420.639H842.219ZM809.475 420.639V378.389H793.503V369.271H836.496V378.389H820.524V420.639H809.475ZM761.41 364.028L768.355 353.647H779.651L768.855 364.028H761.41ZM765.654 380.694L758.639 401.349H772.707L765.654 380.694ZM740.682 420.639L759.392 369.271H772.201L790.948 420.639H779.22L775.654 410.188H755.578L752.092 420.639H740.682ZM693.155 420.639H682.831V369.271H699.018L708.664 409.978L718.163 369.271H734.135V420.639H723.812V377.447L713.914 420.639H703.052L693.153 376.5V420.639H693.155ZM641.167 391.704H653.976C656.827 391.704 658.963 391.145 660.377 390.026C661.819 388.881 662.539 387.172 662.539 384.887C662.539 382.629 661.851 380.942 660.485 379.823C659.145 378.678 657.117 378.108 654.406 378.108H641.167V391.704ZM630.119 420.639V369.271H656.779C661.819 369.271 665.871 370.588 668.942 373.216C672.035 375.829 673.584 379.275 673.584 383.561C673.584 388.501 671.868 392.114 668.436 394.392C667.527 395 666.494 395.511 665.343 395.931C665.994 396.189 666.58 396.469 667.107 396.769C670.13 398.517 671.701 401.451 671.82 405.573L672.073 413.999C672.121 415.676 672.299 416.864 672.612 417.563C672.924 418.262 673.526 418.82 674.414 419.241V420.601H662.214C661.929 420.068 661.676 418.923 661.461 417.176C661.246 415.408 661.122 413.51 661.1 411.483L661.029 406.73C660.98 404.424 660.27 402.779 658.904 401.801C657.558 400.822 655.316 400.333 652.173 400.333H641.167V420.639H630.119ZM595.868 412.914C600.375 412.914 603.905 411.355 606.45 408.232C608.989 405.087 610.264 400.733 610.264 395.163C610.264 389.48 608.989 385.029 606.45 381.814C603.905 378.599 600.376 376.992 595.868 376.992C591.381 376.992 587.868 378.599 585.33 381.814C582.785 385.029 581.515 389.48 581.515 395.163C581.515 400.733 582.774 405.087 585.291 408.232C587.836 411.355 591.359 412.914 595.868 412.914ZM595.868 422.036C588.099 422.036 581.919 419.622 577.341 414.8C572.758 409.977 570.466 403.456 570.466 395.23C570.466 386.843 572.758 380.193 577.341 375.279C581.919 370.339 588.099 367.871 595.868 367.871C603.69 367.871 609.876 370.339 614.432 375.279C619.015 380.193 621.306 386.843 621.306 395.23C621.306 403.456 619.015 409.977 614.432 414.8C609.875 419.624 603.688 422.036 595.868 422.036ZM527.795 420.639V369.271H565.43V378.389H538.839V390.059H562.013V398.903H538.839V420.639H527.795ZM484.334 420.639H474.006V369.271H485.594L506.822 405.296V369.271H517.145V420.639H506.139L484.336 383.629V420.639H484.334ZM453.209 420.639V369.271H464.258V420.639H453.209ZM384.454 420.639V369.271H423.386V378.389H395.499V389.291H421.368V398.136H395.499V411.517H424.606V420.641H384.454V420.639ZM342.252 411.795H351.569C356.056 411.795 359.412 410.328 361.645 407.392C363.899 404.436 365.024 400.011 365.024 394.114C365.024 388.781 363.98 384.787 361.898 382.131C359.81 379.448 356.663 378.109 352.467 378.109H342.252V411.795ZM331.203 420.639V369.271H353.835C361.102 369.271 366.622 371.339 370.387 375.491C374.174 379.637 376.073 385.706 376.073 393.696C376.073 402.501 374.104 409.201 370.172 413.792C366.261 418.356 360.515 420.642 352.936 420.642H331.203",fill:"#7F7F7F"}),ve=r.a.createElement("path",{d:"M565.511 458.363C565.323 455.918 564.236 453.981 562.252 452.562C560.267 451.116 557.68 450.396 554.489 450.396C551.723 450.396 549.561 450.999 548.001 452.213C546.441 453.399 545.661 455.067 545.661 457.207C545.661 458.745 546.479 459.932 548.108 460.772C549.711 461.61 553.128 462.6 558.352 463.745C565.937 465.422 571.005 467.352 573.559 469.546C576.11 471.712 577.389 475.195 577.389 479.992C577.389 484.814 575.464 488.647 571.612 491.491C567.755 494.308 562.548 495.716 555.979 495.716C549.384 495.716 544.23 494.216 540.523 491.211C536.812 488.205 534.826 483.926 534.568 478.384H545.058C545.176 481.109 546.182 483.207 548.071 484.674C549.965 486.141 552.595 486.879 555.979 486.879C559.449 486.879 562.154 486.331 564.097 485.234C566.055 484.116 567.035 482.578 567.035 480.621C567.035 478.69 566.34 477.265 564.947 476.357C563.575 475.449 560.643 474.507 556.156 473.527C547.883 471.712 542.353 469.742 539.566 467.62C536.801 465.524 535.418 462.25 535.418 457.803C535.418 452.814 537.247 448.868 540.91 445.955C544.573 443.019 549.523 441.552 555.763 441.552C561.599 441.552 566.35 443.069 570.013 446.095C573.676 449.127 575.711 453.213 576.109 458.363H565.511ZM503.233 495.717C495.648 495.717 489.617 493.309 485.152 488.486C480.71 483.664 478.487 477.137 478.487 468.917C478.487 460.53 480.806 453.879 485.437 448.961C490.069 444.025 496.331 441.552 504.223 441.552C510.555 441.552 515.768 443.117 519.856 446.234C523.966 449.358 526.366 453.571 527.055 458.884H516.134C515.849 456.647 514.574 454.69 512.31 453.012C510.04 451.314 507.532 450.463 504.795 450.463C500.065 450.463 496.365 452.082 493.696 455.318C491.027 458.533 489.694 463.006 489.694 468.736C489.694 474.564 490.969 478.999 493.518 482.053C496.095 485.08 499.851 486.596 504.795 486.596H504.757C508.964 486.596 512.25 485.011 514.612 481.844C515.908 480.048 516.867 477.941 517.485 475.516V475.414H505.22V466.57H527.055V494.284H519.787L518.723 487.645L518.088 488.483C514.425 493.306 509.459 495.714 503.198 495.714H503.233V495.717ZM439.249 465.385H451.87C454.678 465.385 456.782 464.826 458.18 463.707C459.594 462.568 460.305 460.853 460.305 458.574C460.305 456.31 459.632 454.623 458.282 453.504C456.958 452.364 454.963 451.794 452.295 451.794H439.249V465.385ZM428.367 494.319V442.95H454.635C459.594 442.95 463.592 444.267 466.615 446.902C469.659 449.51 471.187 452.954 471.187 457.246C471.187 462.181 469.498 465.794 466.12 468.079C465.221 468.681 464.205 469.196 463.07 469.616C463.705 469.869 464.286 470.148 464.808 470.454C467.782 472.202 469.332 475.136 469.45 479.26L469.697 487.678C469.746 489.355 469.923 490.544 470.23 491.243C470.537 491.942 471.128 492.501 471.999 492.921V494.286H459.988C459.703 493.748 459.455 492.608 459.24 490.862C459.029 489.088 458.911 487.19 458.885 485.162L458.814 480.409C458.766 478.103 458.072 476.464 456.723 475.486C455.399 474.507 453.193 474.019 450.094 474.019H439.249V494.319H428.367ZM383.986 494.319V442.95H421.061V452.074H394.868V463.745H417.694V472.583H394.868V494.319H383.986ZM373.281 474.96C373.302 482.298 371.662 487.6 368.354 490.863C365.067 494.1 359.703 495.717 352.264 495.717C345.124 495.717 339.832 494.028 336.378 490.652C332.956 487.249 331.23 482.019 331.203 474.96V442.95H342.085V475.31C342.085 478.992 342.925 481.751 344.602 483.595C346.309 485.434 348.858 486.353 352.264 486.353C355.901 486.353 358.498 485.515 360.058 483.837C361.618 482.139 362.398 479.294 362.398 475.311V442.952H373.281V474.96Z",fill:"black"}),be=r.a.createElement("path",{className:"logo--circle",d:"M82.2361 311.197C82.2361 333.895 63.8278 352.291 41.1146 352.291C18.4083 352.293 0 333.895 0 311.197C0 288.505 18.4083 270.108 41.1146 270.108C63.8278 270.108 82.2361 288.505 82.2361 311.197Z",fill:"#FF0000"}),pe=r.a.createElement("path",{d:"M577.221 516.597H331.692V534H577.221V516.597Z",fill:"#FF0000"}),ye=r.a.createElement("path",{d:"M177.872 67.3363H110.86V350.567H177.872V67.3363Z",fill:"black"}),ge=r.a.createElement("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M209.718 350.567H281.54V202.303C281.54 173.917 285.015 120.812 340.854 120.812C395.584 120.812 391.91 176.971 391.91 200.105V253.829H469.014V166.133C469.014 50.4437 371.899 61.3412 367.009 61.3412C330.181 61.3412 298.877 74.0994 278.479 109.904C263.136 68.6644 231.323 65.7825 209.718 67.3418V350.567Z",fill:"black"}),He=r.a.createElement("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M499.703 253.829H576.812V160.241H633.995V108.888H576.812V93.1954C576.812 62.6211 588.572 55.3791 633.995 60.7563V3.34438C499.913 -15.5961 499.702 68.535 499.702 93.1954V253.829H499.703Z",fill:"black"}),Oe=r.a.createElement("path",{d:"M355.301 562.934C351.199 562.934 348.023 564.48 345.773 567.574C343.523 570.645 342.398 574.934 342.398 580.441C342.398 591.902 346.699 597.633 355.301 597.633C358.91 597.633 363.281 596.73 368.414 594.926V604.066C364.195 605.824 359.484 606.703 354.281 606.703C346.805 606.703 341.086 604.441 337.125 599.918C333.164 595.371 331.184 588.855 331.184 580.371C331.184 575.027 332.156 570.352 334.102 566.344C336.047 562.312 338.836 559.23 342.469 557.098C346.125 554.941 350.402 553.863 355.301 553.863C360.293 553.863 365.309 555.07 370.348 557.484L366.832 566.344C364.91 565.43 362.977 564.633 361.031 563.953C359.086 563.273 357.176 562.934 355.301 562.934ZM426.035 580.23C426.035 588.738 423.926 595.277 419.707 599.848C415.488 604.418 409.441 606.703 401.566 606.703C393.691 606.703 387.645 604.418 383.426 599.848C379.207 595.277 377.098 588.715 377.098 580.16C377.098 571.605 379.207 565.078 383.426 560.578C387.668 556.055 393.738 553.793 401.637 553.793C409.535 553.793 415.57 556.066 419.742 560.613C423.938 565.16 426.035 571.699 426.035 580.23ZM388.523 580.23C388.523 585.973 389.613 590.297 391.793 593.203C393.973 596.109 397.23 597.562 401.566 597.562C410.262 597.562 414.609 591.785 414.609 580.23C414.609 568.652 410.285 562.863 401.637 562.863C397.301 562.863 394.031 564.328 391.828 567.258C389.625 570.164 388.523 574.488 388.523 580.23ZM466.008 554.602H477.012L459.539 606H447.656L430.219 554.602H441.223L450.891 585.188C451.43 586.992 451.98 589.102 452.543 591.516C453.129 593.906 453.492 595.57 453.633 596.508C453.891 594.352 454.77 590.578 456.27 585.188L466.008 554.602ZM483.516 606V554.602H494.414V606H483.516ZM549.996 579.809C549.996 588.27 547.582 594.75 542.754 599.25C537.949 603.75 531 606 521.906 606H507.352V554.602H523.488C531.879 554.602 538.395 556.816 543.035 561.246C547.676 565.676 549.996 571.863 549.996 579.809ZM538.676 580.09C538.676 569.051 533.801 563.531 524.051 563.531H518.25V597H522.926C533.426 597 538.676 591.363 538.676 580.09ZM556.324 591.094V582.305H575.203V591.094H556.324ZM607.125 606H596.262V576.258L596.367 571.371L596.543 566.027C594.738 567.832 593.484 569.016 592.781 569.578L586.875 574.324L581.637 567.785L598.195 554.602H607.125V606ZM657.117 576.539C657.117 586.664 654.984 594.223 650.719 599.215C646.453 604.207 639.996 606.703 631.348 606.703C628.301 606.703 625.992 606.539 624.422 606.211V597.492C626.391 597.984 628.453 598.23 630.609 598.23C634.242 598.23 637.23 597.703 639.574 596.648C641.918 595.57 643.711 593.895 644.953 591.621C646.195 589.324 646.91 586.172 647.098 582.164H646.676C645.316 584.367 643.746 585.914 641.965 586.805C640.184 587.695 637.957 588.141 635.285 588.141C630.809 588.141 627.281 586.711 624.703 583.852C622.125 580.969 620.836 576.973 620.836 571.863C620.836 566.355 622.395 562.008 625.512 558.82C628.652 555.609 632.918 554.004 638.309 554.004C642.105 554.004 645.422 554.895 648.258 556.676C651.117 558.457 653.309 561.047 654.832 564.445C656.355 567.82 657.117 571.852 657.117 576.539ZM638.52 562.723C636.27 562.723 634.512 563.496 633.246 565.043C631.98 566.59 631.348 568.816 631.348 571.723C631.348 574.207 631.922 576.176 633.07 577.629C634.219 579.082 635.965 579.809 638.309 579.809C640.512 579.809 642.398 579.094 643.969 577.664C645.539 576.211 646.324 574.547 646.324 572.672C646.324 569.883 645.586 567.527 644.109 565.605C642.656 563.684 640.793 562.723 638.52 562.723Z",fill:"#FF0000"}),Ve=function(e){var t=e.svgRef,a=e.title,n=de(e,["svgRef","title"]);return r.a.createElement("svg",Ce({width:964,height:620,viewBox:"0 0 964 620",fill:"none",ref:t},n),a?r.a.createElement("title",null,a):null,fe,he,ve,be,pe,ye,ge,He,Oe)},Ee=r.a.forwardRef((function(e,t){return r.a.createElement(Ve,Ce({svgRef:t},e))}));a.p,a(351);function je(){return r.a.createElement("div",{style:{height:"100vh",background:"#f5f5f5",display:"flex",alignItems:"center",justifyContent:"center"}},r.a.createElement(Ee,{className:"Loading--logo",style:{height:"150px",width:"auto"}}))}var Me=a(376);function we(e){var t=e.children,a=r.a.Children.toArray(t);return r.a.createElement(n.Fragment,null,a.map((function(e,t){return r.a.createElement(n.Fragment,{key:t},e,t<a.length-2?", ":t<a.length-1?" and ":"")})))}var Se=a(364);var Le=function(){var e=function(){var e=Object(n.useState)(Object(Me.a)(new Date,2)),t=Object(d.a)(e,2),a=t[0],r=t[1];return Object(n.useEffect)((function(){var e=!1;return fetch("https://api.github.com/repos/inf-covid19/tools/branches/master").then((function(e){return e.json()})).then((function(t){e||r(new Date(t.commit.commit.author.date))})).catch((function(e){console.warn("Unable to fetch last updated date.",e)})),function(){e=!0}}),[]),a}();return x().loading?r.a.createElement(je,null):r.a.createElement("div",{className:"App"},r.a.createElement("header",{className:"App-header"},r.a.createElement("img",{src:m.a,height:"100",alt:"logo UFRGS"})," ",r.a.createElement("div",{style:{margin:"0 2em"}},r.a.createElement(p.a,{as:"h1"},"COVID-19 Analysis Tools",r.a.createElement(p.a.Subheader,null,"A set of configurable tools around COVID-19 data."))),r.a.createElement("img",{src:u.a,height:"100",alt:"logo UFRGS-INF"})),r.a.createElement(Se.a,{fluid:!0},r.a.createElement(me,null)),r.a.createElement("footer",null,r.a.createElement("span",null,"Sources:"," ",r.a.createElement(we,null,M.map((function(e){return r.a.createElement("a",{key:e.url,rel:"noopener noreferrer",target:"_blank",href:e.url},e.name)}))),". Last updated at ",l.a(e,"PPpp"),".")))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));o.a.render(r.a.createElement(r.a.StrictMode,null,r.a.createElement(Le,null)),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[220,1,2]]]);
//# sourceMappingURL=main.f77f8006.chunk.js.map