'use strict';
var _ = require( 'lodash' );
var Q = require( 'q' );
var fs = require( 'fs' );
var path = require( 'path' );

/**
 * Extension plugin.
 *
 * @param {qrs} base - Base class, instance of `qrs`.
 * @api public
 */
function Extension ( base ) {

	// Borrowed from http://stackoverflow.com/questions/17251764/lodash-filter-collection-using-array-of-values
	_.mixin( {
		'findByValues': function ( collection, property, values ) {
			return _.filter( collection, function ( item ) {
				return _.contains( values, item[property] );
			} );
		}
	} );

	var defaultFilter = [
		'visualization',
		'visualization-template',
		'mashup',
		'mashup-template'
	];

	/**
	 * Return all installed extensions. Optionally pass in a filter, to get only returned those extensions matching the given filter.
	 *
	 * @param {String[]} [filter] - Optional. Filter installed extensions by `type`. Example: filter = `['visualization', 'visualization-type']` will only return visualization extensions and visualization extension templates.
	 * @returns {promise}
	 * @api public
	 */
	this.getInstalled = function ( filter ) {
		var defer = Q.defer();
		base.get( '/qrs/extension/schema' ).then( function ( data ) {

			if ( filter ) {
				defer.resolve( _.findByValues( data, 'type', filter ) );
			} else {
				defer.resolve( _.findByValues( data, 'type', defaultFilter ) );
			}

		}, function ( err ) {
			defer.reject( err );
		} );
		return defer.promise;
	};

	/**
	 * Same as getInstalled but only returns visualization extensions (type `visualization`).
	 * @returns {promise}
	 * @api public
	 */
	this.getInstalledVis = function () {
		return this.getInstalled( ['visualization'] );
	};

	/**
	 * Same as `getInstalled` but only returns extensions of type `visualization-template`, which are the templates for the Extension editor in Dev Hub.
	 * @returns {promise}
	 * @api public
	 */
	this.getInstalledVisTemplates = function () {
		return this.getInstalled( ['visualization-template'] );
	};

	/**
	 * Same as `getInstalled` but only returns extensions of type `mashup`.
	 * @returns {promise}
	 * @api public
	 */
	this.getInstalledMashups = function () {
		return this.getInstalled( ['mashup'] );
	};

	/**
	 * Same as `getInstalled` but only returns extensions of type `mashup`.
	 * @returns {promise}
	 * @api public
	 */
	this.getInstalledMashupTemplates = function () {
		return this.getInstalled( ['mashup-template'] );
	};

	/**
	 * Deletes an extension.
	 * @param {String} name - Name of the extension.
	 */
	this.delete = function ( name ) {
		var defer = Q.defer();

		base.delete( 'extension/name', name )
			.then( function ( data ) {
				defer.resolve();
			}, function ( err ) {
				defer.reject( err );
			} );

		return defer.promise;
	};

	/**
	 * Uploads an extension.
	 * @param {String} zipFilePath
	 * @todo: Handle "Bad request" in case an extension is already existing.
	 */
	this.upload = function ( zipFilePath ) {
		var defer = Q.defer();

		var skip = false;
		if ( !fs.existsSync( zipFilePath ) ) {
			defer.reject( 'File does not exist: ' + zipFilePath );
			skip = true;
		}
		if ( path.extname( zipFilePath ).toLowerCase() !== '.zip' ) {
			defer.reject( 'Only .zip files can be uploaded.' );
			skip = true;
		}

		if (!skip) {
			base.postFile( 'qrs/extension/upload', null, zipFilePath )
					.then( function ( data ) {
						defer.resolve( data ); //Todo: data contains the file buffer, doesn't make a lot of sense returning this data.
					}, function ( err ) {
						defer.reject( err );
					} );
		}
		return defer.promise;
	};

	/**
	 * Returns whether an extension is installed or not.
	 * @param name
	 */
	this.isInstalled = function ( name ) {

		var defer = Q.defer();

		var retVal = {
			isInstalled: false,
			name: name,
			info: {}
		};
		defer.resolve( retVal );
		return defer.promise;
	};
}

module.exports = Extension;
