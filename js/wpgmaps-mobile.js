(function ($) {
    if (typeof $ === 'undefined') { return; }

    var smallScreen = function () {
        return (typeof window.matchMedia === 'function')
            ? window.matchMedia('(max-width: 768px)').matches
            : window.innerWidth <= 768;
    };

    function wrapInner($container, klass) {
        if ($container.children('.' + klass).length) { return $container.children('.' + klass); }
        var $inner = $('<div>').addClass(klass);
        $container.children().not('button').not('h2').appendTo($inner);
        $container.append($inner);
        return $inner;
    }

    function buildCollapsible($container, label, contentSelector) {
        if ($container.data('wpgmza-collapsible')) { return; }
        $container.data('wpgmza-collapsible', true);
        var $btn = $('<button type="button">')
            .addClass(contentSelector === '.wpgmza_sl_main_inner' ? 'wpgmza_sl_toggle' : 'wpgmaps_directions_toggle')
            .attr('aria-expanded', 'false')
            .text(label + ' ▾');
        $container.prepend($btn);
        $container.addClass('wpgmza-collapsed');
        $btn.on('click', function () {
            var collapsed = $container.hasClass('wpgmza-collapsed');
            $container.toggleClass('wpgmza-collapsed', !collapsed);
            $btn.attr('aria-expanded', collapsed ? 'true' : 'false');
            $btn.text(label + (collapsed ? ' ▴' : ' ▾'));
        });
    }

    function setupCollapsibles() {
        if (!smallScreen()) { return; }

        $('.wpgmaps_directions_outer_div').each(function () {
            var $container = $(this);
            buildCollapsible($container, ($container.find('h2').first().text() || 'Get Directions'), '[id^="wpgmaps_directions_editbox_"]');
        });

        $('.wpgmza_sl_main_div').each(function () {
            var $container = $(this);
            wrapInner($container, 'wpgmza_sl_main_inner');
            buildCollapsible($container, 'Search Locations', '.wpgmza_sl_main_inner');
        });
    }

    function setupGeolocation() {
        $('.wpgmza_sl_geolocate_button').off('click.wpgmza').on('click.wpgmza', function (e) {
            e.preventDefault();
            var $btn = $(this);
            if (!('geolocation' in navigator)) { return; }
            $btn.prop('disabled', true);
            navigator.geolocation.getCurrentPosition(function (pos) {
                $btn.prop('disabled', false);
                if (typeof window.google === 'undefined' || !window.google.maps) { return; }
                var ll = new window.google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
                var geocoder = new window.google.maps.Geocoder();
                geocoder.geocode({ location: ll }, function (results, status) {
                    if (status === 'OK' && results && results[0]) {
                        $('#addressInput').val(results[0].formatted_address);
                    }
                    var mapId = $btn.data('mapid') || $btn.attr('data-mapid');
                    if (mapId && typeof window.searchLocations === 'function') {
                        window.searchLocations(mapId);
                    }
                });
            }, function () {
                $btn.prop('disabled', false);
            }, { enableHighAccuracy: true, timeout: 10000 });
        });
    }

    function buildMarkerCardsFor(mapId) {
        var $table = $('#wpgmza_table_' + mapId);
        if (!$table.length) { return; }
        var $list = $('#wpgmza_marker_card_list_' + mapId);
        if (!$list.length) {
            $list = $('<div>').addClass('wpgmza_marker_card_list').attr('id', 'wpgmza_marker_card_list_' + mapId);
            $table.before($list);
        }
        $list.empty();
        $table.find('tr').each(function () {
            var $row = $(this);
            var $info = $row.find('.wpgmaps_mlist_info');
            if (!$info.length) { return; }
            var $titleA = $info.find('a').first();
            var title = $titleA.text();
            var clickAttr = $titleA.attr('href') || '';
            var desc = $info.clone().find('a').remove().end().text().trim();
            var mid = $row.attr('mid') || '';
            var $card = $('<div>').addClass('wpgmza_marker_card').attr('mid', mid);
            $card.append($('<p>').addClass('wpgmza_marker_card_title').append(
                $('<a>').attr('href', clickAttr || 'javascript:void(0);').text(title)
            ));
            if (desc) {
                $card.append($('<p>').addClass('wpgmza_marker_card_desc').text(desc.substring(0, 240)));
            }
            $list.append($card);
        });
    }

    function setupMarkerCards() {
        if (!smallScreen()) { return; }
        $('table[id^="wpgmza_table_"]').each(function () {
            var id = this.id.replace('wpgmza_table_', '');
            buildMarkerCardsFor(id);
        });
    }

    $(function () {
        setupCollapsibles();
        setupGeolocation();
        setupMarkerCards();
    });

    var resizeT;
    $(window).on('resize', function () {
        clearTimeout(resizeT);
        resizeT = setTimeout(function () {
            setupCollapsibles();
            setupMarkerCards();
        }, 200);
    });

    $(document).on('ajaxComplete', function (event, xhr, settings) {
        if (settings && typeof settings.data === 'string' && settings.data.indexOf('action=wpgmza_datatables') !== -1) {
            setTimeout(setupMarkerCards, 50);
        }
    });
})(window.jQuery);
