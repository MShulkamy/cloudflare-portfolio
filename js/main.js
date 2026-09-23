// js/main.js

$(document).ready(function () {

    $.when(
        $.get("sections/navbar.html"),
        $.get("sections/hero.html"),
        $.get("sections/skills.html"),
        $.get("sections/projects.html"),
        $.get("sections/experience.html"),
        $.get("sections/blog-teaser.html"),
        $.get("sections/awards.html"),
        $.get("sections/reviews.html"),
        $.get("sections/contact.html"),
        $.get("sections/footer.html")
    ).done(function (nav, hero, skills, proj, exp, teaser, awards, reviews, contact, footer) {

        $("#navbar-root").html(nav[0]);
        $("#hero-root").html(hero[0]);
        $("#skills-root").html(skills[0]);
        $("#projects-root").html(proj[0]);
        $("#experience-root").html(exp[0]);
        $("#blog-teaser-root").html(teaser[0]);
        $("#awards-root").html(awards[0]);
        $("#reviews-root").html(reviews[0]);
        $("#contact-root").html(contact[0]);
        $("#footer-root").html(footer[0]);

        console.log("All Sections Loaded!");

        // تحميل السكربتات بالترتيب (واحد ورا التاني) ثم تطبيق التفضيلات المحفوظة
        const scripts = [
            "js/navbar.js",
            "js/hero.js",
            "js/skills.js",
            "js/projects.js",
            "js/experience.js",
            "js/blog-teaser.js",
            "js/awards.js",
            "js/reviews.js",
            "js/contact.js"
        ];

        scripts.reduce(function (chain, src) {
            return chain.then(function () { return $.getScript(src); });
        }, $.Deferred().resolve().promise())
        .done(function () {
            if (window.applySavedPreferences) window.applySavedPreferences();
        })
        .fail(function (err) {
            console.error("Error loading scripts:", err);
        });

    }).fail(function () {
        console.error("Error loading sections.");
    });

});
