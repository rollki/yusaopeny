CW.GoogleMapComponentOutput = CW.MapComponentOutput.extend( {

	geocoder : new google.maps.Geocoder(),

	init : function ( args ) {

		this._super( args );

	},

	init_map : function( ) {

		this.center_point  =  new google.maps.LatLng( 
		                               this.map_data['center_point'][0],
		                               this.map_data['center_point'][1] );

		this.map  =  new google.maps.Map( this.map_el[0], {
			  scaleControl: true,
			  center: this.center_point,
			  zoom: 9,
			  mapTypeId: google.maps.MapTypeId.ROADMAP
			} );

		this.init_map_center();
	},

	init_map_center: function( ) {

		this.search_center_marker = this.search_center_marker || new google.maps.Marker({
			  position: this.center_point,
			  animation: google.maps.Animation.DROP
			});

		if ( this.search_center_marker ) {
			this.search_center_marker.setVisible( false );
			this.search_center_marker.setMap( this.map );
		}

	},

	init_map_locations : function() {
		var self = this;

		var locations = this.locations;

		for ( i = 0; i < locations.length; i++ ) {
		
			var loc    =  locations[i];
			loc.point  =  new google.maps.LatLng( loc.latitude, loc.longitude );

			var html = 	"<div class='marker_tooltip'>" + this.draw_map_location( loc );

			var marker_anchor  =  new google.maps.MarkerImage( this.marker_image_url ) || null;

			marker_anchor  =  loc.icon ? new google.maps.MarkerImage( loc.icon ) : marker_anchor;

			var shadow_anchor  =  loc.shadow ? new google.maps.MarkerImage( loc.shadow ) : null;

			var marker         =  new google.maps.Marker({
			  position: loc.point,
			  icon: marker_anchor, 
			  shadow: shadow_anchor,
			  animation: google.maps.Animation.DROP
			});

			var infowindow = new google.maps.InfoWindow( { content : html } );

			loc.infowindow = infowindow;

			var f = function( infowindow, marker ) {

				return function( ) {

					for ( var i=0;i<self.locations.length;i++ ) {
						self.locations[i].infowindow.close();
					}

					infowindow.open( this.map, marker );
				}
			}

			google.maps.event.addListener( marker, 'click', f( infowindow, marker ) );

			marker.setVisible( false );

			marker.setMap( this.map );

			loc.marker = marker;

		}	

	},

	draw_map_locations : function() {

		var locations = this.apply_filters( this.locations );

		// If the location list is empty, don't adjust the map at all
		if ( locations.length == 0 ) {
			return;
		}

		var bounds = new google.maps.LatLngBounds();

		for ( i = 0; i < locations.length; i++ ) {

			var loc = locations[i];

			bounds.extend(loc.marker.getPosition() );

			loc.marker.setVisible( true );

		}

		this.map.fitBounds( bounds );

	},

	redraw_map_locations : function() {

		for ( i = 0; i < this.locations.length; i++ ) {
			var loc = this.locations[i];
			loc.marker.setVisible( false );
		}

		this.draw_map_locations( );

	},

	// Attempts a map search against Google's
	// GeoCoding API.  If successful, the map
	// is recentered according to the result
	apply_search : function( ) {

		var q = this.search_field_el.val();

		var f = function(results, status) {

			if( status == 'OK' ) {

				this.search_center_point = results[0].geometry.location;

				if ( results[0].geometry.bounds ) {
					this.map.fitBounds( results[0].geometry.bounds );
				}
				else {
					bounds = new google.maps.LatLngBounds();
					bounds.extend( this.search_center_point );
					this.map.fitBounds(bounds);
				}

				this.draw_search_center( );

			}
		}

		this.geocoder.geocode({'address':q}, CWjQuery.proxy( f, this ) );

	},

	draw_search_center : function( ) {

		this.search_center_marker.setPosition( this.search_center_point );
		this.search_center_marker.setVisible( true );

	},
				
	locate_me : function ( position ) {
		var lat = position.coords.latitude;
		var lng = position.coords.longitude;

		this.search_center_point = new google.maps.LatLng( lat, lng );

		this.map.setCenter( this.search_center_point );
		this.map.setZoom(14);

		if ( position.coords.accuracy <= 30 ) {

			this.geocoder.geocode( {'latLng': this.search_center_point }, 
				CWjQuery.proxy( 
					function(results,status){
					if(results[0]) this.search_field_el.val( results[0].formatted_address );
				}, 
				this ) );

			navigator.geolocation.clearWatch( this.geolocation_watcher );
		}

		this.draw_search_center( );

	},


	normalize_point: function( point ) {
		return {'lat':point.lat(), 'lon':point.lng()};
	}


} );
