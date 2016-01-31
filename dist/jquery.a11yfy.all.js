/**
 *
 * jQuery module for accessibility
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2013, 2014 Dylan Barrell
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

(function (jQuery){
    /* Define some universally usable functions at the top of the plugin */

    /**
     * Open a sub-menu and place focus on the first menuitem within it
     * @param {jQuery} $this
     */
    function openMenu($this) {
        if($this.hasClass(config.hasSubClass)) {
            $this.addClass("open").find(">ul>li:visible").first().attr("tabindex", "0").focus();
            $this.attr("tabindex", "-1");
        }
    }

    /**
     * Abstract directional move logic from next/prevInMenu
     * @param {jQuery} $this
     * @param {string} direction - "next" or "prev"
     *
     * Moves the focus to the preceding/mext menuitem
     */
    function moveInMenu($this, direction) {
        var $context = $this,
            $flow = $context[direction]();

        $this.attr("tabindex", "-1");
        while (true) {
            if ($flow.is(":visible")) {
                $flow.attr("tabindex", "0").focus();
                return;
            }
            // Walk the tree
            $context = $flow;
            $flow = $context[direction]();
            if (!$flow.length) {

                $context =  $this.parent().children("li")[direction === "next" ? "first" : "last"]();

                if ($context.is(":visible")) {
                    $context.attr("tabindex", "0").focus();
                    return;
                }
            }
            if ($context[0] === $this[0]) {
                $this.attr("tabindex", "0");
                break;
            }
        }
    }

    /* Config object includes commons strings/classes */
    var config = {
        politeId: "jquery-a11yfy-politeannounce",
        assertiveId: "jquery-a11yfy-assertiveannounce",
        hasSubClass: "a11yfy-has-submenu",
        menuLevel1: "a11yfy-top-level-menu",
        menuLevel2: "a11yfy-second-level-menu",
        menuLevel3: "a11yfy-thir-level-menu",
        valErrClass: "a11yfy-validation-error",
        errSummary: "a11yfy-error-summary",
        errMessage: "a11yfy-error-message",
        skipLink: "a11yfy-skip-link",
        summaryLink: "a11yfy-summary-link"
    },


        $politeAnnouncer = jQuery("#" + config.politeId),
        $assertiveAnnouncer = jQuery("#" + config.assertiveId),
        methods = {
            showAndFocus: function(focus) {
                var $focus = focus ? jQuery(focus) : focus;
                return this.each(function (index, value) {
                    var $this = jQuery(value);

                    $this.show();
                    if ($focus && $focus.length) {
                        if (platform === "iOS") {
                            jQuery("body").focus();
                            setTimeout(function () {
                                $focus.focus();
                            }, 1000);
                        } else {
                            $focus.focus();
                        }
                    }
                });
            },
            focus : function() {
                return this.each(function (index, value) {
                    var $this = jQuery(value);

                    if (platform === "iOS") {
                        jQuery("body").focus();
                        setTimeout(function () {
                            $this.focus();
                        }, 1000);
                    } else {
                        $this.focus();
                    }
                });
            },
            validate : function(options) {
                var opts = jQuery.extend({}, jQuery.fn.a11yfy.defaults.validate, options);
                return this.each(function (index, value) {

                    function errorPlacement() {
                        // do nothing - overrides default behavior
                    }
                    function showErrors() {
                        // do nothing - overrides default behavior
                    }

                    function invalidHandler(event, validator) {
                        var id, invalidIds = [],
                            $this = jQuery(this),
                            $errorSummary = $this.find("." + config.errSummary),
                            $errorSummaryList = jQuery("<ul>");

                        for (id in validator.invalid) {
                            if (validator.invalid.hasOwnProperty(id)) {
                                invalidIds.push(id);
                            }
                        }

                        // remove any previous validation markup
                        $this.find("a." + config.skipLink).remove(); // remove all the old skip links
                        $this.find("." + config.valErrClass).removeClass(config.valErrClass); // Remove old validation errors
                        $this.find("." + config.errMessage).remove(); // remove the old error messages
                        $errorSummary.empty();

                        jQuery(invalidIds).each(function(index, invalidId) {
                            var $input = jQuery("#"+invalidId),
                                $label = jQuery("label[for=\"" + invalidId + "\"]"),
                                $next, $span;
                            $label.addClass(config.valErrClass);
                            $input.addClass(config.valErrClass);

                            // create the summary entry
                            $errorSummaryList.append("<li><a class=\"" + config.skipLink + " " + config.summaryLink + "\" href=\"#" + invalidId + "\">" + $label.text() + "</a>"  + " : " + validator.invalid[invalidId] + "</li>");

                            // add link to the next field with a validation error
                            if (index < (invalidIds.length - 1) && opts.skipLink) {

                                $next = jQuery("<a>",{
                                    class: config.skipLink,
                                    href: "#" + invalidIds[index+1],
                                    text: jQuery.a11yfy.getI18nString("skipToNextError", undefined, jQuery.fn.a11yfy.defaults.strings)
                                });

                                if ($input.parent()[0].nodeName === "P") {
                                    $input.parent().after($next);
                                } else {
                                    $input.after($next);
                                }
                            }

                            // Add the error message into the label
                            $span = jQuery("<span>", {
                                class: config.errMessage,
                                text: " - " + validator.invalid[invalidId]
                            });
                            $label.append($span);
                        });
                        if (opts.summary) {
                            // Add the summary to the document
                            $errorSummary.append($errorSummaryList);
                        }
                    }
                    var $this = jQuery(value),
                        vOptions = jQuery.extend({}, opts.validatorOptions, {
                                invalidHandler : invalidHandler,
                                errorPlacement : errorPlacement,
                                showErrors : showErrors
                            });

                    $this.validate(vOptions);
                    if (opts.skipLink) {
                        $this.on("click", "a." + config.skipLink, function(e) {
                            var $target = jQuery(e.target);

                            jQuery($target.attr("href")).select().focus();
                            e.preventDefault();
                            e.stopPropagation();
                        });
                    }
                    $this.children().first().before(
                        jQuery("<div class=\"" + config.errSummary + "\" role=\"alert\" aria-live=\"assertive\">")
                    );
                    // Add the aria-required attributes to all the input elements that have the required
                    // attribute
                    $this.find("[required]").prop("aria-required", true);
                });
            },
            menu : function() {
                return this.each(function (index, value) {
                    var $this = jQuery(value),
                        $menu = $this;

                    if (value.nodeName !== "UL") {
                        throw new Error("The menu container must be an unordered list");
                    }
                    /* First make all anchor tags in the structure non-naturally focusable */
                    $this.find("a").attr("tabindex", "-1");
                    /* Set the roles for the menubar */
                    $this.attr("role", "menubar").addClass(config.menuLevel1);
                    /* set the aria attributes and the classes for the sub-menus */
                    $this.find(">li>ul")
                        .addClass(config.menuLevel2)
                        .parent()
                            .addClass(config.hasSubClass)
                            .prop("aria-haspopup", true);
                    $this.find(">li>ul>li>ul")
                        .addClass(config.menuLevel3)
                        .parent()
                            .addClass(config.hasSubClass)
                            .prop("aria-haspopup", true);
                    /*
                     * Set up the keyboard and mouse handlers for all the individual menuitems
                     */
                    $this.find("li").each(function(index, value) {
                        /* Set the roles for the sub-menus and the menuitems */
                        var $this = jQuery(value);

                        $this.attr({
                            "role": "menuitem",
                            "tabindex": "-1"
                        });
                        $this.find("ul").each(function(index, value) {
                            jQuery(value).attr("role", "menu");
                        });

                    }).on("keypress", function(e) {
                        /*
                         * This implements the WAI-ARIA-PRACTICES keyboard functionality where
                         * pressing the key, corresponding to the first letter of a VISIBLE element
                         * will move the focus to the first such element after the currently focused
                         * element
                         */
                        var keyCode = e.charCode || e.which || e.keyCode,
                            keyString = String.fromCharCode(keyCode).toLowerCase(),
                            ourIndex = -1,
                            currentItem = this,
                            $this = jQuery(this),
                            $nextItem, $prevItem,
                            $menuitems = $menu.find("li[role=\"menuitem\"]:visible");

                        if (keyCode === 9) {
                            return true;
                        }

                        $menuitems.each(function(index, element) {
                            var $el = jQuery(element);
                            if (element === currentItem) {
                                ourIndex = index;
                            }
                            if (index > ourIndex && !$nextItem) {
                                if ($el.text().trim().toLowerCase().indexOf(keyString) === 0) {
                                    if (ourIndex !== -1) {
                                        $nextItem = $el;
                                    } else if (!$prevItem) {
                                        $prevItem = $el;
                                    }
                                }
                            }
                        });
                        if (!$nextItem && $prevItem) {
                            $nextItem = $prevItem;
                        }
                        if ($nextItem) {
                            $nextItem.attr("tabindex", "0").focus();
                            $this.attr("tabindex", "-1");
                            if ($nextItem.parent().get(0) !== $this.parent().get(0)) {
                                $this.parent().parent("li").removeClass("open");
                            }
                        }
                        e.stopPropagation();
                    }).on("keydown", function(e) {
                        /*
                         * This implements the WAI-ARIA-PRACTICES keyboard navigation functionality
                         */
                        var keyCode = e.which || e.keyCode,
                            handled = false,
                            $this = jQuery(this),
                            $childLink = $this.children("a").first();

                        if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
                            // not interested
                            return;
                        }

                        switch(keyCode) {
                            case 32: // space
                            case 13: // enter
                                handled = true;
                                if ($childLink.length) {
                                    /* If this is a leaf node, activate it */
                                    $childLink.trigger("click");
                                } else {
                                    /* If it has a sub-menu, open the sub-menu */
                                    openMenu($this);
                                }
                                break;
                            case 37: //left
                            case 27: //esc
                                handled = true;
                                if (keyCode === 37 && $this.parent().hasClass(config.menuLevel1)) {
                                    /* If in the menubar, then simply move to the previous menuitem */
                                    moveInMenu($this, "next");
                                } else {
                                    if ($this.parent().attr("role") === "menu") {
                                        // this is part of a submenu, set focus on containing li
                                        $this.parent().parent().attr("tabindex", "0").focus()
                                            .removeClass("open");
                                        $this.attr("tabindex", "-1");
                                    }
                                }
                                break;
                            case 38: //up
                                handled = true;
                                if ($this.parent().hasClass(config.menuLevel1)) {
                                    /* If in the menubar, then open the sub-menu */
                                    openMenu($this);
                                } else {
                                    /* If in sub-menu, move to previous element */
                                    moveInMenu($this, "prev");
                                }
                                break;
                            case 39: //right
                                handled = true;
                                if ($this.parent().hasClass(config.menuLevel1)) {
                                    /* If in menubar, move to next menuitem */
                                    moveInMenu($this, "next");
                                } else {
                                    /* If in sub-menu, open sub-sub-menu */
                                    openMenu($this);
                                }
                                break;
                            case 40: //down
                                handled = true;
                                if ($this.parent().hasClass(config.menuLevel1)) {
                                    /* If in menubar, open sub-menu */
                                    openMenu($this);
                                } else {
                                    /* If in sub-menu, move to the next menuitem */
                                    moveInMenu($this, "next");
                                }
                                break;
                        }
                        if (handled) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        return true;
                    }).on("blur", function() {
                    }).on("click", function() {
                        var $this = jQuery(this);

                        $this.toggleClass("open");
                    }).first().attr("tabindex", "0"); // Make the first menuitem in the menubar tab focusable
                    $this.on("keydown", function (e) {
                        /*
                         * This callback handles the tabbing out of the widget
                         */
                        var focusInTopMenu = false,
                            keyCode = e.which || e.keyCode;

                        if (e.ctrlKey || e.altKey || e.metaKey) {
                            // not interested
                            return;
                        }
                        if (keyCode !== 9) {
                            return true;
                        }
                        /* Find out whether we are currently in the menubar */
                        $this.children("li").each(function(index, value) {
                            if (jQuery(value).attr("tabindex") === "0") {
                                focusInTopMenu = true;
                            }
                        });
                        if (!focusInTopMenu) {
                            /*
                             * If not in the menubar, close sub-menus and set the tabindex of the top item in the
                             * menubar so it receives focus when the user tabs back into the menubar
                             */
                            $this.find(">li li[tabindex=0]").attr("tabindex", "-1");
                            setTimeout(function () {
                                // This code is in a setTimeout so that shift tab works correctly AND
                                // because there is a Firefox (Windows) bug that
                                // causes the default event for a TAB to not happen properly if the visibility of the
                                // currently focused node is chanhed mid event (e.g. removal of the open class)
                                $this.find("li.open").each(function(index, value) {
                                    if (jQuery(value).parent().hasClass(config.menuLevel1)) {
                                        jQuery(value).attr("tabindex", "0");
                                    }
                                }).removeClass("open");
                            }, 0);
                        }
                        return true;
                    });
                });
            }
        },
        ua = window.navigator.userAgent || "",
        platform = ua.match(/iPhone|iPad|iPod/) ? "iOS" :
                    ua.match(/Mac OS X/) ? "OSX" :
                    ua.match(/Windows/) ? "Windows" : "Other";
    
    jQuery.a11yfy = function () {} ;

    jQuery.fn.a11yfy = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1 ));
        } else {
            jQuery.error("Method " +  method + " does not exist on jQuery.a11yfy");
        }
    };

    jQuery.fn.a11yfy.defaults = {
        strings : {
            skipToNextError: "skip to next field with an error"
        },
        validate : {
            skipLink : true,
            summary : true,
            validatorOptions : {}
        },
        // Add the id/class config values, so they can be changed if desired
        config: config
    };

    jQuery.a11yfy.getI18nString = function(str, values, strings) {
        var msg = strings[str], v;

        if (values) {
            for (v in values) {
                msg = msg.replace("${"+v+"}", values[v]);
            }
        }
        return msg;
    };

    jQuery.a11yfy.politeAnnounce = function (msg) {
        $politeAnnouncer.append(jQuery("<p>").text(msg));
    };

    jQuery.a11yfy.assertiveAnnounce = function (msg) {
        $assertiveAnnouncer.append(jQuery("<p>").text(msg));
    };

    // Add the polite announce div to the page
    if (!$politeAnnouncer || !$politeAnnouncer.length) {
        jQuery(document).ready(function () {
            $politeAnnouncer = jQuery("<div>").attr({
                    "id": config.politeId,
                    "role": "log",
                    "aria-live": "polite",
                    "aria-relevant": "additions"
                }).addClass("offscreen");
            jQuery("body").append($politeAnnouncer);
        });
    }
    // Add the polite announce div to the page
    if (!$assertiveAnnouncer || !$assertiveAnnouncer.length) {
        jQuery(document).ready(function () {
            $assertiveAnnouncer = jQuery("<div>").attr({
                    "id": config.assertiveId,
                    "role": "log",
                    "aria-live": "assertive",
                    "aria-relevant": "additions"
                }).addClass("offscreen");
            jQuery("body").append($assertiveAnnouncer);
        });
    }

})(jQuery);
;/**
 *
 * jQuery module for accessible data tables
 *
 * Copyright (C) 2013 Dylan Barrell. All Rights Reserved as specified in the LICENSE file
 *
 */

(function (jQuery){
    var methods;

    methods = {
        init: function (options) {
            var opts = jQuery.extend({}, jQuery.fn.tables.defaults, options);
            return this.each(function () {
                var $table = jQuery(this),
                    $anchors, data, $select, cellIndex, dimensions, newDimensions, resizeTimer, headers;

                function anchorClickHandler(e) {
                    var $this = jQuery(this),
                        sorted = $this.attr("data-sorted"),
                        direction = "asc",
                        index = this.parentNode.cellIndex,
                        $span = $this.find("span.offscreen"),
                        msg;

                    if (sorted) {
                        direction = (sorted === "asc" ? "desc" : "asc");
                    }
                    // reset all the previous sorting
                    $anchors.removeAttr("data-sorted");
                    sortTableData(data, direction, index);
                    redrawTable($table, data);
                    $this.attr("data-sorted", direction);
                    // Reset the offscreen text
                    $span.text("");
                    // Make announcement
                    if (direction === "asc") {
                        msg = jQuery.a11yfy.getI18nString("tableSortedAscending", {
                            column: $this.text()
                        }, jQuery.fn.tables.defaults.strings);
                    } else {
                        msg = jQuery.a11yfy.getI18nString("tableSortedDescending", {
                            column: $this.text()
                        }, jQuery.fn.tables.defaults.strings);
                    }
                    jQuery.a11yfy.politeAnnounce(msg);
                    // Set the offscreen text
                    setSortedText($span, $this);
                    e.preventDefault();
                }

                function selectChangeHandler() {
                    var $this = jQuery(this),
                        val = $this.val(),
                        $anchor = $this.parent().find("a"),
                        cellIndex = this.parentNode.cellIndex,
                        msg;

                    jQuery(data).each(function (index, value) {
                        if (val+"" === value[cellIndex]+"" || val === "__none__") {
                            value[value.length-1].show();
                        } else {
                            value[value.length-1].hide();
                        }
                    });
                    // Make announcement
                    msg = jQuery.a11yfy.getI18nString("tableFilteredOnAndBy", {
                        column: $anchor.text(),
                        value: (val === "__none__" ? jQuery.a11yfy.getI18nString("all") : val)
                    }, jQuery.fn.tables.defaults.strings);
                    jQuery.a11yfy.politeAnnounce(msg);

                    $this.hide();
                    $anchor.show().focus();
                }

                if (opts.sortFilter !== "none") {
                    if (opts.responsive) {
                        throw new Error("responsive and sortFilter are mutually exclusive options because sortFilter implies a data table with row data and responsive implies columnar data");
                    }
                    $table.find("th").each(function (index, value) {
                        var $this = jQuery(value);

                        if ($this.attr("data-filter") &&
                            (opts.sortFilter === "both" || opts.sortFilter === "filter")) {
                            $this.wrapInner("<a href=\"#\" data-filter=\"true\">");
                        } else if (!$this.attr("data-filter") && (opts.sortFilter === "both" || opts.sortFilter === "sort")) {
                            $this.wrapInner("<a href=\"#\">");
                        }
                    });

                    $anchors = $table.find("th a");
                    data = getTableData($table);
                    $anchors.each( function (index, anchor) {
                        var $anchor = jQuery(anchor),
                            timeout;

                        function anchorFocusHandler(e) {
                            var $this = jQuery(this),
                                $span;

                            if ($this.attr("data-filter")) {
                                if (timeout) {
                                    clearTimeout(timeout);
                                    timeout = undefined;
                                }
                                $select = $this.parent().find("select");
                                cellIndex = $this.parent().get(0).cellIndex;
                                if (!$select.length) {
                                    $select = jQuery("<select>").attr("aria-label", $this.text() + jQuery.a11yfy.getI18nString("filterable", undefined, jQuery.fn.tables.defaults.strings));
                                    $select.append(jQuery("<option>").attr("value", "__none__").attr("label", jQuery.a11yfy.getI18nString("all", undefined, jQuery.fn.tables.defaults.strings)));
                                    jQuery(data).each(function (index, value) {
                                        $select.append(jQuery("<option>").text(value[cellIndex]));
                                    });
                                    $this.parent().append($select);
                                    $select.bind("mouseover focus", selectFocusHandler)
                                        .bind("mouseout blur", selectBlurHandler)
                                        .bind("change", selectChangeHandler);
                                } else {
                                    $select.show();
                                }
                                if (e.type === "focus") {
                                    $select.focus();
                                }
                                $this.hide();
                            } else {
                                $span = $this.find("span.offscreen");
                                if (!$span.length) {
                                    $span = jQuery("<span class=\"offscreen\">");
                                    $this.append($span);
                                }
                                setSortedText($span, $this);
                            }

                        }

                        function anchorBlurHandler() {
                            var $this = jQuery(this), $span;

                            if (!$this.attr("data-filter")) {
                                $span = $this.find("span.offscreen");
                                $span.empty().text("");
                            }
                        }

                        function selectFocusHandler() {
                            if (timeout) {
                                clearTimeout(timeout);
                                timeout = undefined;
                            }
                        }

                        function selectBlurHandler() {
                            var $this = jQuery(this);
                            timeout = setTimeout(function () {
                                $this.hide();
                                $this.parent().find("a").show();
                            }, 500);
                        }

                        $anchor.bind("click", anchorClickHandler)
                            .bind("focus mouseover", anchorFocusHandler)
                            .bind("blur mouseout", anchorBlurHandler);
                    });
                    if ((opts.sortFilter === "both" || opts.sortFilter === "sort")) {
                        $anchors.first().click();
                    }
                } else if (opts.responsive && !opts.responsive.rowBased) {
                    // table must have a thead and a tbody
                    if (!$table.find("tbody").length) {
                        throw new Error("Columnar responsive table must have a tbody");
                    }
                    if (!$table.find("thead").length) {
                        throw new Error("Columnar responsive table must have a thead");
                    }
                    data = getTableData($table);
                    headers = getTableHeaders($table);
                    dimensions = getDimensions();
                    drawTable( $table, data, headers, dimensions, opts);
                    jQuery(window).on("resize", function () {
                        newDimensions = getDimensions();
                        if (!equalDimensions(newDimensions, dimensions)) {
                            if (resizeTimer) {
                                clearTimeout(resizeTimer);
                                resizeTimer = undefined;
                            }
                            dimensions = newDimensions;
                            resizeTimer = setTimeout(function () {
                                drawTable( $table, data, headers, newDimensions, opts);
                            }, 50);
                        }
                    });
                    if (opts.responsive.css) {
                        jQuery("body").append(
                            jQuery("<style>\n" +
                                jQuery.a11yfy.getI18nString("cssString", {breakPoint:opts.responsive.breakPoint}, jQuery.fn.tables.defaults.css) +
                                "</style>"));
                    }
                } else if (opts.responsive && opts.responsive.rowBased) {
                    if (!opts.responsive.css) {
                        throw new Error("css must be used in conjunction with rowBased");
                    }
                    jQuery("body").append(
                        jQuery("<style>\n" +
                            jQuery.a11yfy.getI18nString("cssString", {breakPoint:opts.responsive.breakPoint}, jQuery.fn.tables.defaults.css) +
                            "</style>"));
                    if (!$table.find("thead").length) {
                        $table.children().first().before(jQuery("<thead></thead>"));
                    }
                    if (!$table.find("tbody").length) {
                        $table.find("thead").after(jQuery("<tbody></tbody>"));
                        $table.find("tbody").append($table.find("tr"));
                    }
                }
            });
        }
    };

    function drawSmartPhoneTable(data, headers) {
        var html = "<thead></thead>", i, _ilen, j, _jlen;
        for (i = 0, _ilen = data[0].length - 1; i < _ilen; i++) {
            html += "<tr>";
            if (headers) {
                html += "<th scope=\"row\">" + headers[i] + "</th>";
            }
            for (j = 0, _jlen = data.length; j < _jlen; j++) {
                html += "<td>" + data[j][i] + "</td>";
            }
            html += "</tr>";
        }
        return html;
    }

    function drawDesktopTable(data, headers) {
        var html = "", i, _ilen, j, _jlen;
        if (headers) {
            html += "<tr>";
            jQuery(headers).each(function (index, value) {
                html += "<th scope=\"col\">" + value + "</th>";
            });
            html += "</tr>";
        }
        for (j = 0, _jlen = data.length; j < _jlen; j++) {
            html += "<tr>";
            for (i = 0, _ilen = data[0].length - 1; i < _ilen; i++) {
                html += "<td>" + data[j][i] + "</td>";
            }
            html += "</tr>";
        }
        return html;
    }

    function isSmartPhone(dimensions, breakPoint) {
        if (dimensions.width <= breakPoint) {
            return true;
        }
        return false;
    }

    function drawTable($table, data, headers, dimensions, options) {
        if (isSmartPhone(dimensions, options.responsive.breakPoint)) {
            $table.html(drawSmartPhoneTable(data, headers));
        } else {
            $table.html(drawDesktopTable(data, headers));
        }
    }

    function getDimensions() {
        var retVal = { width: 0, height: 0};
        retVal.width = window.innerWidth-1;
        retVal.height = window.innerHeight;
        return retVal;
    }

    function equalDimensions(first, second) {
        if (first.width === second.width && first.height === second.height) {
            return true;
        }
        return false;
    }

    function getSortedText($this) {
        var sorted = $this.attr("data-sorted");
        return (sorted === "asc" ? jQuery.a11yfy.getI18nString("sortableSortedAscending", undefined, jQuery.fn.tables.defaults.strings) :
                (sorted === "desc" ? jQuery.a11yfy.getI18nString("sortableSortedDescending", undefined, jQuery.fn.tables.defaults.strings) :
                jQuery.a11yfy.getI18nString("sortableNotSorted", undefined, jQuery.fn.tables.defaults.strings)));
    }

    function getTableData($table) {
        var retVal = [];
        $table.find("tbody tr").each(function (index, value) {
            var $this = jQuery(value), row = [];
            $this.find("td").each(function (index, td) {
                var text = jQuery.trim(jQuery(td).text()),
                    intNum, flt;

                intNum = parseInt(text, 10);
                flt = parseFloat(text);
                if (intNum.toString() === text) {
                    row.push(intNum);
                } else if (flt.toString() === text) {
                    row.push(flt);
                } else {
                    row.push(text);
                }
            });
            row.push($this); // put the row into the data so we can manipulate
            retVal.push(row);
        });
        return retVal;
    }
    function getTableHeaders($table) {
        var retVal = [];
        $table.find("tr").first().find("th").each(function (index, value) {
            var $this = jQuery(value);
            retVal.push($this.text());
        });
        return retVal;
    }

    function sortTableData(data, direction, index) {
        data.sort(function (first, second) {
            if (typeof first[index] !== typeof second[index]) {
                if (typeof first[index] === "string") {
                    return (direction === "asc" ? -1 : 1);
                } else if (typeof second[index] === "string") {
                    return (direction === "asc" ? 1 : -1);
                }
            }
            return first[index] < second[index] ? (direction === "asc" ? -1 : 1) :
                    ( first[index] > second[index] ? (direction === "asc" ? 1 : -1) : 0);
        });
    }
    function redrawTable($table, data) {
        var $tbody = $table.find("tbody");
        jQuery(data).each(function (index, value) {
            $tbody.append(value[value.length - 1]);
        });
    }
    function setSortedText($span, $this) {
        $span.text(getSortedText($this));
    }

    // add the jquery instance method
    jQuery.fn.tables = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1 ));
        } else if (typeof method === "object" || ! method) {
            return methods.init.apply(this, arguments);
        } else {
            jQuery.error("Method " +  method + " does not exist on jQuery.tables");
        }
    };

    jQuery.fn.tables.defaults = {
        sortFilter: "both",
        strings : {
            sortableSortedAscending: " Sortable, Sorted Ascending",
            sortableNotSorted: " Sortable, Not Sorted",
            sortableSortedDescending: " Sortable, Sorted Descending",
            filterable: ", Filterable",
            all: "All",
            tableSortedAscending: "Table sorted by ${column}, Ascending",
            tableSortedDescending: "Table sorted by ${column}, Descending",
            tableFilteredOnAndBy: "Table filtered on ${column}, by ${value}"
        },
        css : {
              cssString: "@media\n" +
              "(max-width: ${breakPoint}px) {\n" +
                "/* Force table to not be like tables anymore but still be navigable as a table */\n" +
                "table, thead, tbody, tr {\n" +
                  "width: 100%;\n" +
                "}\n" +

                "td, th {\n" +
                  "display: block;\n" +
                "}\n" +

                "/* Hide table headers with display: none because accessibility APIs do not pick up reliably on these headers anyway */\n" +
                "thead tr {\n" +
                  "display:none;\n" +
                "}\n" +

                "tr { border: 1px solid #ccc; }\n" +

                "td, th {\n" +
                  "/* Behave  like a \"row\" */\n" +
                  "border: none;\n" +
                  "border-bottom: 1px solid #eee;\n" +
                  "position: relative;\n" +
                "}\n" +

                "td:before, th:before {\n" +
                  "/* Now like a table header */\n" +
                  "position: absolute;\n" +
                  "/* Top/left values mimic padding */\n" +
                  "top: 6px;\n" +
                  "left: 6px;\n" +
                  "width: 45%;\n" +
                  "padding-right: 10px;\n" +
                  "white-space: nowrap;\n" +
                "}\n" +
              "}\n"
        }
    };
})(jQuery);
