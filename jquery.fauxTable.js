( function( $, window ){
	String.prototype.regexIndexOf = function(regex, startpos) {
	    var indexOf = this.substring(startpos || 0).search(regex);
	    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
	}
	var $window = $(window);
	$window.resizedEvent();

	$.fn.fauxTable = function( options ){
		var that = this;
		var noop = function(){};
		var defaults = {
			cellSelector: '.tb-td',
			cellInnerSelector: '.inner-container',
			classesThatCanChange: [ 'active' ],
			excludeSelector: false,
			beforeResize: noop,
			afterResize: noop
		};
		var settings = $.extend( defaults, options );
		if ( typeof settings.classesThatCanChange === 'string' ){
			settings.classesThatMayChange = [ settings.classesThatMayChange ];
		}
		this.each( function(){
	 		var $container = $(this);
 			var $cells = $(this).children( settings.cellClass );

 			// no cells, stop dead
 			if ( $cells.size() === 0 ) return;

 			var cellElements = [];
 			// for each of the cell's children, add their classes to the array
 			$cells.each( function(){

 				var $innerContainer = settings.cellInnerSelector ? $(this).children( settings.cellInnerSelector ) : false;
 				if( ! $innerContainer || $innerContainer.size() === 0 ){
 					var $toAlign = $(this).children();
 				} else {
 					var $toAlign = $innerContainer.children();
 				}
 				$(this).data('toAlign', $toAlign );
 				if ( settings.excludeSelector ){
 					$toAlign = $toAlign.filter( ':not('+settings.excludeSelector+')');
 				}
 				$toAlign.each( function(){
 					var classes = $(this).attr('class' );
 					var allClasses = classes ? $(this).attr('class').split( /\s+/) : [];
 					var selector = [ $(this).prop('tagName') ];
 					for( var i in allClasses ){
 						if ( allClasses[i] && settings.classesThatCanChange.indexOf( allClasses[i] ) === -1 ){
 							selector.push( allClasses[i]);
 						}
 					}
 					var selector =  selector.join( '.' );
 					if ( cellElements.indexOf( selector ) === -1 ){
 						cellElements.push( selector )
 					}
 				});
 			});
 			function adjustHeights( $toAdjust, height ){
 				if ( $toAdjust.size() > 1 ){
 					$toAdjust.height( height );
 				}
 			}
 			function lineUpCells( e, resize ){
 				settings.beforeResize( $cells, resize );
 				var elClass, selector, maxHeight;
				// record the indexes of each linebreak
				var lineBreaks = [];
				var index = 0;
				var cellHeight = 0;
				var lastTop = $cells.first().offset().top;
				$cells.each( function(){
					if ( $(this).height() > cellHeight ){
						cellHeight = $(this).height();
					}
				});
				$cells.css({ height: cellHeight });
				$cells.each( function(){
					var topPos = $(this).offset().top;
					if ( topPos !== lastTop ){
						if ( index !== 0 ){
							lineBreaks.push( true );
						} else {
							lineBreaks.push( false )
						}
						lastTop = topPos;
					} else {
						lineBreaks.push( false );
					}
					index++;
				});
				$cells.css({ height: '' });
 				for( i in cellElements ){
 					maxHeight = 0;
 					selector = cellElements[i];
 					var $toAdjust = $();
 					var lastTop = 0;
 					var index = -1;
 					$cells.each( function(){
 						index++;
		 				var $toAlign = $(this).data('toAlign').filter( selector );
		 				// if just a tag name
		 				if ( selector.indexOf( '.' ) === -1 && selector.indexOf( '#') === -1 ){
			 				for ( j in cellElements ){
			 					if ( cellElements[j] !== selector ){
			 						var thisSelector = cellElements[j];
			 						if ( thisSelector.substr( 0, thisSelector.regexIndexOf(/[#\.]/) ) === selector ){
			 							$toAlign = $toAlign.not( thisSelector );
			 						}
			 					}
			 				}
		 				}
		 				// if no elements to align, return
		 				if ( $toAlign.size() === 0 ) return;
 						// return it to natural height
 						$toAlign.height( '' );
 						// otherwise, raise maxHeight if necessary
 						var height = $toAlign.height();
 						if ( height > maxHeight ){
 							maxHeight = height;
 						}
 						$toAdjust = $toAdjust.add( $toAlign );

 						// if there is a line break
 						// adjust cells, clear the maxHeight, clear the list of cells to adjust
 						if ( lineBreaks[ index + 1 ]){
  							adjustHeights( $toAdjust, maxHeight ); // adjust heights of previous cells
 							maxHeight = 0; // clear maxHeight
 							$toAdjust = $(); // and clear
 							return;
 						}
 					});
 					adjustHeights( $toAdjust, maxHeight ); // adjust heights of any inline cellElements 
 				}
 				settings.afterResize( $cells, resize );
 			}
 			$container.resizedEvent().on( 'resized-w resized-init', lineUpCells );
 			lineUpCells();
 		});
	}
}( jQuery, window ) );
