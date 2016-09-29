(function(document) {
  'use strict';
  //console.log('Start App');

  var app = document.querySelector('#app');

  app.properties = {
    pvalues : Array,
    svalues : Array,
    results: Array,
    dateFrom: Date,
    dateTo: Date
  };

  document.addEventListener('WebComponentsReady', function() {

    var selected_values = CONFIG.CATCH_STRINGS[Math.floor(Math.random() * (CONFIG.CATCH_STRINGS.length - 0)) + 0];
    var prms = app.getQueryParams(location.search);
    var w1 = (prms.w1) ? prms.w1 : selected_values[0];
    var w2 = (prms.w2) ? prms.w2 : selected_values[1];
    var date_from = (prms.date_from) ? prms.date_from : false;
    var date_to = (prms.date_to) ? prms.date_to : false;
    var now_date = new Date();
    var min_date = new Date(2016, 5, 1);

    if ( !isNaN(Date.parse(date_from)) ) {
      date_from = new Date(date_from);
      if ( date_from < min_date) date_from = min_date;
    } else {
      date_from = false;
    }

    if ( !isNaN(Date.parse(date_to))) {
      date_to = new Date(date_to);
      if ( date_from && date_to < date_from ) date_to = false;
    } else {
      date_to = false;
    }

    app.set('dateFrom', (date_from)? date_from : new Date(2016, 5, 1) ); // Start date for RSS Scrape
    app.set('dateTo', (date_to) ? date_to : new Date(now_date.getFullYear(), now_date.getMonth(), now_date.getDate()) );

    app.$.PickerFrom.set('date', app.dateFrom);
    app.$.PickerFrom.set('minDate', min_date);
    app.$.PickerFrom.set('maxDate', app.dateTo);

    app.$.PickerTo.set('date', app.dateTo);
    app.$.PickerTo.set('minDate', app.dateFrom);
    app.$.PickerTo.set('maxDate', app.dateTo);

    app.$.InputFrom.value = app.dateFrom.toISOString();
    app.$.InputTo.value = app.dateTo.toISOString();

    app.$.Word1Input.set('value', w1);
    app.$.Word2Input.set('value', w2);

    var ttl = 'RSS Joust - '+w1+' VS '+w2;
    var replace_url = '/?w1='+encodeURI(w1)+'&w2='+encodeURI(w2);
    // if ( date_from ) replace_url +='&date_from='+encodeURI(date_from.toISOString());
    // if ( date_to ) replace_url +='&date_to='+encodeURI(date_to.toISOString());
    replace_url +='&date_from='+encodeURI(app.dateFrom.toISOString());
    replace_url +='&date_to='+encodeURI(app.dateTo.toISOString());

    window.history.replaceState( {page: ttl+' '+ app.dateFrom.toUTCString() + '-' + app.dateTo.toUTCString() } ,ttl ,replace_url );
    window.onpopstate = function(event) {
      //console.log("location: " + document.location + ", state: " + JSON.stringify(event.state));
      window.location.href = window.location.href;
    };

    app.submitForm();

    [].forEach.call(
      this.querySelectorAll('awesome-button'),
      function(el){
        el.addEventListener('click', function(e) {
          app.gaSend('event', 'Share', 'open', el.getAttribute('type'));
        },false)
      });

  });

  app.localizeDate = function( d ) {
    return moment(d).format('D MMM, YYYY')
  };

  app.dateIso = function( d ) {
    return d.toISOString();
  };

  app.getQueryParams = function (qs) {
    var params, re, tokens;
    qs = qs.split("+").join(" ");
    params = {};
    tokens = void 0;
    re = /[?&]?([^=]+)=([^&]*)/g;
    while (tokens = re.exec(qs)) {
     params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }
    return params;
  };

  app.submitForm = function(e) {
    this.$.MainForm.submit();
    this.$.MainForm.querySelector('paper-button').disabled = true;
    this.$.MainLoader.classList.remove('hide');
    this.$.GraphSelector.classList.add('hide');
    this.$.GraphWrapper.querySelector('svg').innerHTML = '';
    this.$.GraphWrapper.appendChild(document.createElement('svg'));
    this.pvalues = [
      {
        "key": '',
        "color": "#cd950c",
        "values": Array()
      },
      {
        "key": '',
        "color": "#5ebe9e",
        "values": Array()
      }
    ];

    this.svalues = [
      {
        "key": '',
        "color": "#cd950c",
        "values": Array()
      },
      {
        "key": '',
        "color": "#5ebe9e",
        "values": Array()
      }
    ];

  }

  app.inputKeyDown = function( e ) {
    if ( e.keyCode == 13 ) {
      this.submitForm();
    }
  };

  app.realSubmit = function( e ) {
    this.$.GraphWrapper.setAttribute('data-word1', e.detail.word1);
    this.$.GraphWrapper.setAttribute('data-word2', e.detail.word2);
    var ttl = 'RSS Joust - '+e.detail.word1+' VS '+e.detail.word2;

    if ( window.history && window.history.state && window.history.state.page !== ttl) {
      var replace_url = '/?w1='+encodeURI(e.detail.word1)+'&w2='+encodeURI(e.detail.word2);

      replace_url +='&date_from='+encodeURI(app.dateFrom.toISOString());
      replace_url +='&date_to='+encodeURI(app.dateTo.toISOString());
      window.history.pushState( {page: ttl +' '+ app.dateFrom.toUTCString() + '-' + app.dateTo.toUTCString() } ,ttl , replace_url );
      document.title = ttl;
    }

    this.gaSend('event', 'Joust', 'submit', e.detail.word1 +' VS '+ e.detail.word2);
  };


  app.handleEntriesResponse = function( e ){
    var r = e.detail.response;
    this.$.MainLoader.classList.add('hide');
    this.$.MainForm.querySelector('paper-button').disabled = false;
    this.$.GraphSelector.classList.remove('hide');
    if (r.success) {
      this.processEntries(r.results);
    } else {
      var $error_header = document.createElement("h2");
      $error_header.classList.add('t-center');
      $error_header.textContent = 'Oooppsie, something went wrong :/ !!';
      this.$.GraphWrapper.appendChild($error_header);
    }
  };

  app.processEntries = function ( results ) {
    //console.log(results);
    this.results = results;

    this.pvalues[0].key = this.$.GraphWrapper.dataset.word1;
    this.pvalues[1].key = this.$.GraphWrapper.dataset.word2;

    this.svalues[0].key = this.$.GraphWrapper.dataset.word1;
    this.svalues[1].key = this.$.GraphWrapper.dataset.word2;


    results.forEach(function(obj, i, ar) {
      this.pvalues[0].values.push({ label: obj.title, value: (obj.word1)? obj.word1.length : 0 } );
      this.pvalues[1].values.push({ label: obj.title, value: (obj.word2)? obj.word2.length : 0 } );

      this.svalues[0].values.push({ label: obj.title, value: (obj.word1)? app.processScores(obj.word1) : 0 } );
      this.svalues[1].values.push({ label: obj.title, value: (obj.word2)? app.processScores(obj.word2) : 0 } );

    }, this);

    app.selectMeasure();

  };

  app.selectMeasure = function(e) {
    if ( !this.$.GraphRadio.selected ) {
      this.$.GraphRadio.selectIndex(0)
    }

    if (this.$.GraphRadio.selected == 'sentiment') {
      this.drawGraph(this.svalues);
    } else if ( this.$.GraphRadio.selected == 'volume' ) {
      this.drawGraph(this.pvalues);
    }

    // This should just look at clicks
    this.gaSend('event', 'Metric', 'select', this.$.GraphRadio.selected);
  };

  app.processScores = function( obj ) {
    var total_score = 0;
    obj.forEach( function(o,i){
      //total_score += o.score;
      total_score += o.comparative;
    });
    return total_score;
  };

  app.drawGraph = function(values_data) {
    var t = this;
    nv.addGraph(function() {
      var chart = nv.models.multiBarHorizontalChart()
              .x(function(d) { return d.label })
              .y(function(d) { return d.value })
              .margin({top: 30, right: 20, bottom: 50, left: 175})
              .showValues(true)
              //.groupSpacing(0.3)
              //.tooltips(true)
              //.transitionDuration(350)
              .showControls(true);

      chart.yAxis
          .tickFormat(d3.format(',.2f'))

      chart.yAxis
        .axisLabel( t.$.GraphRadio.selected.charAt(0).toUpperCase() + t.$.GraphRadio.selected.slice(1) );

      d3.select('#GraphWrapper svg')
          .datum(values_data)
          .call(chart);

      chart.color(["#FF0000","#00FF00","#0000FF"])
      chart.color(function (d, i) {
          var colors = d3.scale.category20().range().slice(10);
          return colors[i % colors.length-1];
      })

      chart.multibar.dispatch.on("elementClick", function(e) {
        //console.log(e);
        var bar_obj = new Object();
        var bar_obj = t.results.find(function (d) {
            return d._id === e.data.label.replace(/\W/g, '');
        });

        bar_obj.trigger = e.data.key;

        if ( t.$.GraphWrapper.getAttribute('data-word1') === e.data.key ) {
          bar_obj.entries_trigger = bar_obj.word1;
        } else if ( t.$.GraphWrapper.getAttribute('data-word2') === e.data.key ) {
          bar_obj.entries_trigger = bar_obj.word2;
        }

        t.openEntriesModal(bar_obj);
      });

      nv.utils.windowResize(chart.update);
      window.naa = chart
      return chart;
    });
  };


  app.openEntriesModal = function(obj) {
    var markup = '';
    this.$.EntriesModal.classList.remove('hide');
    document.body.scrollTop = 0;
    document.body.classList.add('o-hidden');
    this.$.EntriesModal.querySelector('.js-modal-heading').innerHTML = obj.title;
    this.$.EntriesModal.querySelector('.js-modal-meta-word').innerHTML = obj.trigger;
    this.$.EntriesModal.querySelector('.js-modal-meta-score').innerHTML = parseFloat(app.processScores(obj.entries_trigger)).toFixed(2);

    if ( this.$.GraphWrapper.getAttribute('data-word1') === obj.trigger ) {
      this.$.EntriesModal.querySelector('.js-modal-meta-word').classList.add('word1-color');
      this.$.EntriesModal.querySelector('.js-modal-meta-word').classList.remove('word2-color');
    } else if ( this.$.GraphWrapper.getAttribute('data-word2') === obj.trigger ) {
      this.$.EntriesModal.querySelector('.js-modal-meta-word').classList.add('word2-color');
      this.$.EntriesModal.querySelector('.js-modal-meta-word').classList.remove('word1-color');
    }

    obj.entries_trigger.forEach(function(o, i) {
      markup += '<a href="'+o.link+'" target="_blank" class="row middle-xs middle-sm middle-md middle-lg">'
                  + '<span class="col-xs-10 col-sm-10 col-md-10 col-lg-10">'
                    + '<h3>'+o.title+'</h3>'
                  + '</span>'
                  + '<span class="col-xs-2 col-sm-2 col-md-2 col-lg-2 t-right">'
                    + '<h3>'+o.comparative+'</h3>'
                  + '</span>'
                +'</a>'
    });

    this.$.EntriesModal.querySelector('.js-entries-modal-body').innerHTML = markup;
    document.addEventListener('keyup', app.closeKey);

    this.gaSend('event', 'Modal', 'open', obj.title +' for '+ obj.trigger);
  };

  app.closeKey = function(e) {
    if(e.keyCode === 27) {
      app.closeEntriesModal(e);
      document.removeEventListener('keyup', app.closeKey);
    }
  };

  app.closeEntriesModal = function(e) {
    e.preventDefault();
    this.$.EntriesModal.classList.add('hide');
    document.body.classList.remove('o-hidden');
    this.gaSend('event', 'Modal', 'close', this.$.EntriesModal.querySelector('.js-modal-heading').innerHTML +' for '+ this.$.EntriesModal.querySelector('.js-modal-meta-word').innerHTML );
  };

  app.selectDate = function ( e ) {
    e.preventDefault();
    this.$.CalendarModal.toggle();
    this.$[e.currentTarget.getAttribute('data-idcalshow')].classList.remove('hide');
    this.$[e.currentTarget.getAttribute('data-idcalhide')].classList.add('hide');
  };

  app.dismissCalendar = function ( e ) {
    if ( e.detail.confirmed ) {
      app.set('dateFrom', this.$.PickerFrom.date );
      app.set('dateTo', this.$.PickerTo.date );
      app.submitForm();
    }
  };

  app.gaSend = function ( htype, ecategory, eaction, elabel ) {
    if ( window.ga != undefined && window.ga.create != undefined) {
      ga('send', {
        hitType: htype,
        eventCategory: ecategory,
        eventAction: eaction,
        eventLabel: elabel
      });
    } else {
      console.log('GA send: ' + htype + ' | ' + ecategory + ' | ' + eaction  + ' | ' + elabel)
    }
  };

})(document);