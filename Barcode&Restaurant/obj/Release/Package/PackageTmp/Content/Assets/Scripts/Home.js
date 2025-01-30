document.addEventListener('DOMContentLoaded', function () {
    try {
        var carouselElement = document.getElementById('carouselExampleIndicators');
        var carousel = new bootstrap.Carousel(carouselElement, {
            interval: 2000, // 2 saniye
            ride: 'carousel' // Carousel'in otomatik olarak başlatılmasını sağlar
        });
    }
    catch (e) {
        console.error(e);
    }
});