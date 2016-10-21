( function( $, window ){
	String.prototype.regexIndexOf = function(regex, startpos) {
	    var indexOf = this.substring(startpos || 0).search(regex);
	    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
	}
	var $window = $(window);
	$window.resizedEvent();

	function FauxTable($el, args){
		this.$el = $el;
		this.settings = $.extend( {}, {
			cellSelector: '.tb-td',
			cellInnerSelector: false,
			classesThatCanChange: [ 'active' ],
			excludeSelector: false,
			beforeResize: function(){},
			afterResize: function(){}
		}, args );
		
		if ( typeof this.settings.classesThatCanChange === 'string' ){
			settings.classesThatMayChange = [ settings.classesThatCanChange ];
		}

		this.init();
		this.apiMethods = {
			destroy: this.destroy,
			reinit: this.reinit,
			resize: this.handleResize
		};
		$window.bind('resized-w.fauxtable', this, this.handleResize );
		this.handleResize();
	}
	FauxTable.prototype.init = function(){
		this.cellData = [];
		this.cellElements = [];
		this.$cells = this.$el.children( this.settings.cellSelector );
		this.$cells.each( function(e, cell){
			var $cell = $(cell);
			var $innerContainer = this.settings.cellInnerSelector ? $cell.children( this.settings.cellInnerSelector ) : false;
			if( ! $innerContainer || $innerContainer.length === 0 ){
				var $toAlign = $cell.children();
			} else {
				var $toAlign = $innerContainer.children();
			}
			if ( this.settings.excludeSelector ){
				$toAlign = $toAlign.filter( ':not('+this.settings.excludeSelector+')');
			}
			this.cellData.push({
				$cell: $cell,
				$toAlign: $toAlign,
				lineBreak: null
			});
			$toAlign.each( function(e, el){
				var classes = $(el).attr('class' );
				var allClasses = classes ? $(el).attr('class').split( /\s+/) : [];
				var selector = [ $(el).prop('tagName') ];
				for( var i in allClasses ){
					if ( allClasses[i] && this.settings.classesThatCanChange.indexOf( allClasses[i] ) === -1 ){
						selector.push( allClasses[i]);
					}
				}
				selector = selector.join( '.' );
				if ( this.cellElements.indexOf( selector ) === -1 ){
					this.cellElements.push( selector )
				}
			}.bind(this));
		}.bind(this) );
	}
	FauxTable.prototype.handleResize = function(e){
		if ( !this.$el && e.data.$el ){
			// this object is passed to the event
			// so the function can be unbound from the window properly when destroyed
			arguments.callee.apply( e.data );
			return;
		}
		// one or fewer cells, stop dead
 		if ( this.$cells.size() <= 1 ) return;
		
		this.recordLineBreaks();
		
		this.settings.beforeResize( this.cellData, $(window).width() );


		var selector;
 		$.each( this.cellElements, function( i, selector ){
			var $elementsToAdjust = $();
			var lastTop = 0;
			var maxHeightOfElement = 0;
			$.each( this.cellData, function(i, data){
	 			var $el = data.$toAlign.filter( selector );

				// if no elements to align, return
				if ( $el.length === 0 ) return;
				
				// return it to natural height
				$el.height( '' );
				
				// raise maxHeight if necessary
				var h = $el.height();
				if ( h > maxHeightOfElement ){
					maxHeightOfElement = h;
				}
				$elementsToAdjust = $elementsToAdjust.add( $el );
				// if there is a line break on the very next cell
				if ( this.cellData.length >= (i + 1) || this.cellData[ i + 1 ].lineBreak ){
					// adjust heights of this element in previous cells
					$elementsToAdjust.height( maxHeightOfElement );
					// clear the maxHeightOfElement
					maxHeightOfElement = 0;
					// clear the list of cells to adjust
					$toAdjust = $(); // and clear
				}
			}.bind(this));
 		}.bind(this));
 		return this;
	}
	FauxTable.prototype.recordLineBreaks = function(){
		// set every cell to the tallest height there is to
		// ensure that they all clear each other.
		var maxNaturalCellHeight = 0;
		this.$cells.each( function(){
			if ( $(this).height() > maxNaturalCellHeight ){
				maxNaturalCellHeight = $(this).height();
			}
		});
		this.$cells.css({ height: maxNaturalCellHeight });

		// record location of all line breaks
		var previousTopPos = this.$cells.first().offset().top;
		$.each( this.cellData, function(i, data){
			var topPos = data.$cell.offset().top;
			if ( topPos > previousTopPos ){
				if ( i !== 0 ){
					data.lineBreak = true;
				} else {
					data.lineBreak = false;
				}
				previousTopPos = topPos;
			} else {
				data.lineBreak = false;
			}
		});

		// reset cells to natural height
		this.$cells.css({
			height: ''
		});
		return this;
	}
	FauxTable.prototype.api = function( methodName, arguments ){
		if ( this.apiMethods.hasOwnProperty( methodName ) ){
			return this.apiMethods[ methodName ].apply(this, [ arguments ]);
		}
		console.warn( 'fauxTable() has no method "'+methodName+'"');
		return;
	}
	FauxTable.prototype.reinit = function(){
		$(window).unbind( 'resized-w.fauxtable', this.handleResize );

		//reset heights
		$.each( this.cellData, function(i,data){
			data.$cell.height( '' );
			data.$toAlign.height( '' );
		});

		this.init();
		this.handleResize();
		return this;
	}
	FauxTable.prototype.destroy = function(){
		for ( i in $(window).data('events')['resized-w'] ){
			// unbind resize event
			if ( $(window).data('events')['resized-w'][i].data === this ){
				$(window).data('events')['resized-w'].splice( i, 1 );
			}
		}
		this.$el.data('fauxtable', null);
		//reset heights
		$.each( this.cellData, function(i,data){
			data.$cell.height( '' );
			data.$toAlign.height( '' );
		});
		return true;
	}
	$.fn.fauxTable = function( options ){
		return this.each( function(){
			if ( typeof( options ) === 'string' ){
				var methodName = options;
				if ( $(this).data('fauxtable') ){
					return $(this).data('fauxtable').api(methodName, arguments[1] );
				} else {
					console.warn( 'Attempted to run .fauxTable("'+options+'") but FauxTable is not initialized on this element' );
					return;
				}
			}
			$(this).data('fauxtable', new FauxTable($(this), options) );
		});
	}
}( jQuery, window ) );
