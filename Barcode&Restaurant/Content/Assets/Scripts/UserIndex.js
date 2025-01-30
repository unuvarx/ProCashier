$(document).ready(function () {
    // Mouse üzerine gelindiğinde raporları göster
    $('.demo-dropdown').hover(function () {
        $(this).find('.reports').stop().slideDown();
    }, function () {
        $(this).find('.reports').stop().slideUp();
    });

    // Dropdown'a tıklandığında raporları göster (toggle() fonksiyonu kullanılır)
    $('.demo-dropdown').click(function () {
        var reports = $(this).find('.reports');
        reports.stop().slideToggle();

        // Açık olan dropdown'ları kapat
        $('.reports').not(reports).slideUp();
    });

    // Dokümanın herhangi bir yerine tıklandığında açık dropdown menüleri kapat
    $(document).click(function (event) {
        if (!$(event.target).closest('.demo-dropdown').length) {
            $('.reports').slideUp();
        }
    });

    // .reports üzerinden ayrıldığında menünün kapanması
    $('.reports').mouseleave(function () {
        $(this).stop().slideUp();
    });

    // .reports öğesine fare ile tıklandığında menünün açık kalması
    $('.reports').hover(function (e) {
        e.stopPropagation(); // Diğer olaylardan etkilenmez.
    });
});
