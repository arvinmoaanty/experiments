'use strict';

var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');

var SketchfabSDK = require('../vendors/sketchfab-sdk/Sketchfab');
var SketchfabGif = require('../vendors/sketchfab-gif/sketchfab-gif');

var tplModelInfo = _.template(require('./GeneratorModelInfo.tpl'));

var GeneratorView = Backbone.View.extend({

    events: {
        'submit': 'generate'
    },

    initialize: function() {
        this.api = null;
        this.client = null;
    },

    loadModel: function(urlid) {
        this.urlid = urlid;

        SketchfabSDK.Model.byId(this.urlid).then(
            function(response) {
                this.model = response;
                this.enableTools();
                this.render();
            }.bind(this),
            function() {
                console.log('Error');
            }
        );
    },

    render: function() {
        console.log('render');

        var images = _.sortBy(this.model.thumbnails.images, 'width');
        var thumbnailUrl = images[0].url;

        this.$el.find('.model-info').html(tplModelInfo({
            model: this.model,
            thumbnail: thumbnailUrl
        }));
        return this;
    },

    generate: function(e) {
        e.preventDefault();

        if (!this.urlid) {
            return;
        }

        this.disableTools();

        var width = parseInt(this.$el.find('input[name="width"]').val(), 10);
        var height = parseInt(this.$el.find('input[name="height"]').val(), 10);
        var duration = parseInt(this.$el.find('select[name="duration"]').val(), 10);

        this.$el.find('.viewer .preview').empty();

        this.hideSharing();
        this.showProgress();
        this.updateProgress('Loading model...');

        var skfbgif = new SketchfabGif(this.urlid, {
            width: width,
            height: height,
            duration: duration
        });
        skfbgif.on('progress', function(res) {
            console.log(res.progress);

            this.updateProgress('Rendering ' + res.progress + '%');

            if (res.progress === 100) {
                var url = URL.createObjectURL(res.data);
                this.onGenerateEnd(url);
            }

        }.bind(this));
        skfbgif.start();
    },

    showProgress: function() {
        this.$el.find('.progress').addClass('active');
    },
    hideProgress: function() {
        this.$el.find('.progress').removeClass('active');
    },
    updateProgress: function(message) {
        this.$el.find('.progress .message').text(message);
    },

    showSharing: function() {
        this.$el.find('.share').addClass('active');
    },
    hideSharing: function() {
        this.$el.find('.share').removeClass('active');
    },

    onGenerateEnd: function(url) {
        this.hideProgress();
        this.showSharing();
        this.$el.find('.viewer .preview').html('<img src="' + url + '">');
        this.enableTools();

        this.$el.find('.save').attr('href', url);
        this.$el.find('.save').attr('download', this.model.name);
    },

    enableTools: function() {
        this.$el.find('.tools').addClass('active');
        this.$el.find('.btn-primary').removeAttr('disabled');
    },

    disableTools: function() {
        this.$el.find('.tools').removeClass('active');
        this.$el.find('.btn-primary').attr('disabled', 'disabled');
    }
});

module.exports = GeneratorView;
