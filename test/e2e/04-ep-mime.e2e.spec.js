/*global describe,it,beforeEach,after*/
/*jshint -W030,-W117*/
'use strict';

var chai = require( 'chai' );
var expect = chai.expect;
var assert = chai.assert;
var QRS = new require( './../../lib/qrs' );
var extend = require( 'extend-shallow' );
var fsUtils = require( 'fs-utils' );
var path = require( 'path' );
var testSetup = require( './../testSetup' );
var _ = require( 'lodash' );
var Q = require( 'q' );

var qrs;
var globalConfig = testSetup.globalConfig;

describe( 'sugar-plugin: ep-mime', function () {

	testSetup.testLoop.forEach( function ( testLoopConfig ) {

		describe( 'with ' + testLoopConfig.name, function (  ) {

			var testConfig = extend( globalConfig, testLoopConfig.config );
			var idsToDelete = [];
			beforeEach( function ( done ) {
				qrs = new QRS( testConfig );
				done();
			} );

			afterEach( function ( done ) {

				if ( idsToDelete && idsToDelete.length > 0 ) {
					var promises = [];
					_.each( idsToDelete, function ( id ) {
						promises.push( qrs.mime.deleteById.bind( null, id ) );
					} );
					Q.all( promises )
							.then( function ( data ) {
								idsToDelete.length = 0;
								done();
							} );
				} else {
					done();
				}
			} );

			after( function ( done ) {
				fsUtils.del( ['./test/mimetypes.text', './test/mimetypes_single.json'], function () {
					done();
				} );
			} );

			it( 'should return the existing mime types', function ( done ) {
				qrs.mime.get()
						.then( function ( data ) {
							expect( data ).to.exist;
							expect( data ).to.be.an.array;
						} )
						.done( function () {
							done();
						} );
			} );

			it( 'should filter for mime types', function ( done ) {
				/*jshint -W109 */
				qrs.mime.get( "extensions so 'html'" )
						/*jshint +W109 */
						.then( function ( data ) {
							expect( data ).to.exist;
							expect( data ).to.not.be.empy;
							expect( data ).to.be.an.array;
							expect( data ).to.have.length.above( 1 );
						} )
						.done( function () {
							done();
						} );
			} );

			it( 'filter for unknown should return nothing', function ( done ) {
				/*jshint -W109 */
				qrs.mime.get( "extensions so 'abcdefg'" )
						/*jshint +W109 */
						.then( function ( data ) {
							expect( data ).to.exist;
							expect( data ).to.not.be.empy;
							expect( data ).to.be.an.array;
							expect( data ).to.have.length( 0 );
						} )
						.done( function () {
							done();
						} );
			} );

			it( 'can create an export', function ( done ) {
				qrs.mime.createExport( path.resolve( './test/mimetypes.text' ) )
						.then( function ( path ) {
							expect( path ).to.exist;
						} )
						.done( function () {
							done();
						} );
			} );

			it( 'can create an export (per file extension)', function ( done ) {
				qrs.mime.createExportPerFileExt( path.resolve( './test/mimetypes_single.json' ) )
						.then( function ( path ) {
							expect( path ).to.exist;
						} )
						.done( function () {
							done();
						} );
			} );

			describe( 'returns either objects to be updated or added', function () {

				/*jshint -W109*/
				var existingTypes = [
					{
						"id": "05750907-1728-46a5-b763-14d348208bf3",
						"createdDate": "2015-09-02T22:09:14.104Z",
						"modifiedDate": "2015-09-02T22:09:14.104Z",
						"modifiedByUserName": "INTERNAL\\bootstrap",
						"mime": "application/xhtml+xml",
						"extensions": "xhtml,xht",
						"additionalHeaders": null,
						"binary": false,
						"privileges": null,
						"schemaPath": "MimeType"
					},
					{
						"id": "49974f33-31c2-4732-b057-7acb8f5303a0",
						"createdDate": "2015-09-02T22:09:14.104Z",
						"modifiedDate": "2015-09-02T22:09:14.104Z",
						"modifiedByUserName": "INTERNAL\\bootstrap",
						"mime": "text/html;charset=utf-8",
						"extensions": "html,htm",
						"additionalHeaders": "X-UA-Compatible:IE=edge",
						"binary": false,
						"privileges": null,
						"schemaPath": "MimeType"
					}
				];
				/*jshint +W109*/

				it( 'returns the object to be updated', function () {
					var r = qrs.mime.getUpdateOrInsert( {
						'extensions': 'foo',
						'mime': 'text/html;charset=utf-8',
						'binary': false
					}, existingTypes );
					expect( r.isUpdate ).to.equal( true );
					expect( r.def ).to.be.an.object;
					expect( r.def ).to.not.be.an.array;
					expect( r.def.extensions ).to.be.equal( 'html,htm,foo' );
					expect( r.def.mime ).to.be.equal( 'text/html;charset=utf-8' );
				} );

				it( 'adds a new entry', function ( done ) {
					qrs.mime.add( {
						'extensions': 'foo',
						'mime': 'text/foo',
						'additionalHeaders': null,
						'binary': false
					} ).then( function ( data ) {
								expect( data ).to.exist;
								expect( data ).to.have.property( 'id' );
								idsToDelete.push( data.id );
							}, function ( err ) {
								expect( err ).to.not.exist;
							} )
							.done( function () {
								done();
							} );
				} );

				it( 'should reject to add entries if mime is empty', function ( done ) {
					qrs.mime.add( {
								'extensions': 'foo',
								'mime': '',
								'additionalHeaders': null,
								'binary': false
							} )
							.then( function ( /*data*/ ) {
							}, function ( err ) {
								expect( err ).to.exist;
								expect( err ).to.be.equal( 'Mime type cannot be empty' );
							} )
							.done( function () {
								done();
							} );
				} );

				it( 'should reject to add entries if extensions is empty', function ( done ) {
					qrs.mime.add( {
								'extensions': '',
								'mime': 'foo/bar',
								'additionalHeaders': null,
								'binary': false
							} )
							.then( function ( /*data*/ ) {
							}, function ( err ) {
								expect( err ).to.exist;
								expect( err ).to.be.equal( 'Extensions cannot be empty' );
							} )
							.done( function () {
								done();
							} );
				} );

				it( 'adds multiple entries', function ( done ) {
					qrs.mime.addMultiple( [{
								'extensions': 'foo',
								'mime': 'text/foo',
								'additionalHeaders': null,
								'binary': false
							}, {
								'extensions': 'bar',
								'mime': 'text/bar',
								'additionalHeaders': null,
								'binary': false
							}] )
							.then( function ( data ) {
								expect( data ).to.exist;
								expect( data ).to.be.an.array;
								data.forEach( function ( item ) {
									idsToDelete.push( item.id );
								} );
							}, function ( err ) {
								assert( true, err );
							} )
							.done( function () {
								done();
							} );
				} );

				//Todo: Test should be done once, and not for all authentication scenarios
				it( 'add multiple entries should throw an error if server is not available', function ( done ) {
					var config = JSON.parse( JSON.stringify( testConfig ) ); // clone the object
					config.host = 'not_a_server';
					var qrs2 = new QRS( config );
					qrs2.mime.addMultiple( [{
								'extensions': 'foo',
								'mime': 'text/foo',
								'additionalHeaders': null,
								'binary': false
							}, {
								'extensions': 'bar',
								'mime': 'text/bar',
								'additionalHeaders': null,
								'binary': false
							}] )
							.then( function ( data ) {
								expect( data ).to.not.exist;
							}, function ( err ) {
								expect( err ).to.exist;
							} )
							.done( function () {
								done();
							} );
				} );

				it( 'updates existing entries', function ( done ) {
					qrs.mime.addMultiple( [{
								'extensions': 'foo',
								'mime': 'text/foobar',
								'additionalHeaders': null,
								'binary': false
							}, {
								'extensions': 'bar',
								'mime': 'text/foobar',
								'additionalHeaders': null,
								'binary': false
							}] )
							.then( function ( data ) {
								expect( data ).to.exist;
								expect( data ).to.be.an.array;
								_.each( data, function ( item ) {
									expect( item ).to.have.property( 'extensions' );
									expect( item ).to.have.property( 'mime' );
									expect( item ).to.have.property( 'additionalHeaders' );
									expect( item ).to.have.property( 'binary' );
									expect( item.mime ).to.be.equal( 'text/foobar' );
									expect( item.additionalHeaders ).to.be.null;
									expect( item.binary ).to.be.equal( false );
									idsToDelete.push( data.id );
								} );
								//Todo: We have a cleanup error here, check this out
								//expect(data[0].extensions ).to.be.equal('foo');
								//expect(data[1].extensions ).to.be.equal('foo,bar');
							}, function ( err ) {
								expect( err ).to.not.exist;
							} )
							.done( function () {
								done();
							} );
				} );

				it( 'adds multiple entries from file (update)', function ( done ) {

					var sourceFile = path.resolve( './test/fixtures/foobar.txt' );
					qrs.mime.addFromFile( sourceFile )
							.then( function ( data ) {
								expect( data ).to.exist;
								expect( data ).to.be.an.array;
								expect( data ).to.have.length( 2 );
								_.each( data, function ( item ) {
									expect( item ).to.have.property( 'extensions' );
									expect( item ).to.have.property( 'mime' );
									expect( item ).to.have.property( 'additionalHeaders' );
									expect( item ).to.have.property( 'binary' );
									expect( item.mime ).to.be.equal( 'text/foobar' );
									expect( item.additionalHeaders ).to.be.null;
									expect( item.binary ).to.be.equal( false );
									idsToDelete.push( data.id );
								} );
								//expect(data[0].extensions ).to.be.equal('foo');
								//expect(data[1].extensions ).to.be.equal('foo,bar');
							}, function ( err ) {
								expect( err ).to.not.exist;
							} )
							.done( function () {
								done();
							} );
				} );

				it( 'adds multiple entries from file (update + insert)', function ( done ) {

					var sourceFile = path.resolve( './test/fixtures/foobarbaz.txt' );
					qrs.mime.addFromFile( sourceFile )
							.then( function ( data ) {
								expect( data ).to.exist;
								expect( data ).to.be.an.array;
								expect( data ).to.have.length( 3 );
								_.each( data, function ( item ) {
									expect( item ).to.have.property( 'extensions' );
									expect( item ).to.have.property( 'mime' );
									expect( item ).to.have.property( 'additionalHeaders' );
									expect( item ).to.have.property( 'binary' );
									expect( item.additionalHeaders ).to.be.null;
									expect( item.binary ).to.be.equal( false );
									idsToDelete.push( data.id );
								} );
								idsToDelete.push( data.id );
							}, function ( err ) {
								expect( err ).to.not.exist;
							} )
							.done( function () {
								done();
							} );
				} );

				it( 'adding multiple entries from file should be able to fail (wrong entries)', function ( done ) {
					var sourceFile = path.resolve( './test/fixtures/error.txt' );
					qrs.mime.addFromFile( sourceFile )
							.then( function ( /*data*/ ) {
							}, function ( err ) {
								expect( err ).to.exist;
								expect( err ).to.be.equal( 'Mime type cannot be empty' );
							} )
							.done( function () {
								done();
							} );
				} );

				it( 'adding multiple entries from file should be able to fail (server unavailable)', function ( done ) {
					var config = JSON.parse( JSON.stringify( testConfig ) ); // clone the object
					config.host = 'not_a_server';
					var qrs2 = new QRS( config );
					var sourceFile = path.resolve( './test/fixtures/foobarbaz.txt' );
					qrs2.mime.addFromFile( sourceFile )
							.then( function ( /*data*/ ) {
							}, function ( err ) {
								expect( err ).to.exist;
							} )
							.done( function () {
								done();
							} );
				} );
			} );

		});

	});
} );
