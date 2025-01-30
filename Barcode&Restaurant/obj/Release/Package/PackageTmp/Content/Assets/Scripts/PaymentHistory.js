$(document).ready(function () {
    let BoughtPackets = [];
    let Users = [];
    let currentPage = 1; // Başlangıçta gösterilen sayfa numarası
    const itemsPerPage = 5; // Her sayfada gösterilecek satır sayısı

    // Sayfaları oluşturan fonksiyon
    function createPaginationButtons(totalPages, currentPage) {
        try {
            const maxButtons = 7; // Gösterilecek maksimum buton sayısı

            let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
            let endPage = Math.min(totalPages, startPage + maxButtons - 1);

            if (endPage - startPage < maxButtons - 1) {
                startPage = Math.max(1, endPage - maxButtons + 1);
            }

            let paginationHtml = '';
            if (startPage > 1) {
                paginationHtml += '<button class="pageButton" data-page="1">1</button>';
                if (startPage > 2) {
                    paginationHtml += '<span>...</span>';
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                paginationHtml += `<button class="pageButton ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    paginationHtml += '<span>...</span>';
                }
                paginationHtml += `<button class="pageButton" data-page="${totalPages}">${totalPages}</button>`;
            }

            $('.pagination').html(paginationHtml);
        }
        catch (e) {
            console.error(e);
        }

        
    }

    // Sayfa değiştirme işlemleri
    $(document).on('click', '.pageButton', function () {
        try {
            currentPage = parseInt($(this).attr('data-page'));
            showTR(currentPage, BoughtPackets);
        }
        catch (e) {
            console.error(e);
        }
        
    });

    // Kullanıcı arama işlemi
    $('#findUser').on('input', function () {
        try {
            let searchText = $(this).val().trim().toLowerCase();

            // Kullanıcıları filtreye göre bul
            let filteredUsers = Users.filter(user => {
                let fullName = (user.FirstName + ' ' + user.LastName).toLowerCase();
                let username = user.Username.toLowerCase();
                return fullName.includes(searchText) || username.includes(searchText);
            });

            // Kullanıcının paketlerini filtreye göre bul
            let filteredPackets = [];
            if (searchText === '') {
                filteredPackets = BoughtPackets;
            } else {
                filteredPackets = BoughtPackets.filter(packet => {
                    return filteredUsers.some(user => user.UserId === packet.UserId);
                });
            }

            // Filtrelenmiş paketleri göster
            currentPage = 1; // Sayfa numarasını sıfırla
            showTR(currentPage, filteredPackets);
        }
        catch (e) {
            console.error(e);
        }
        
    });


    try {
        // Satın alım geçmişini getirme işlemi
        $.ajax({
            url: '/Admin/GetPaymentsHistory',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                BoughtPackets = response.BoughtPackets;
                Users = response.Users;
                showTR(currentPage, BoughtPackets);
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        });
    }
    catch (e) {
        console.error(e);
    }
    

    // Tarih formatlama fonksiyonu
    function formatDate(dateString) {
        try {
            let timestamp = parseInt(dateString.match(/\d+/)[0], 10);
            let date = new Date(timestamp);
            let day = date.getDate();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();
            let hours = date.getHours();
            let minutes = date.getMinutes();
            let formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;
            return formattedDate;
        }
        catch (e) {
            console.error(e);
        }
        
    }

    // Satın alım geçmişini gösterme fonksiyonu
    function showTR(page, packets) {
        try {
            let startIndex = (page - 1) * itemsPerPage;
            let endIndex = startIndex + itemsPerPage;
            let displayedPackets = packets.slice(startIndex, endIndex);

            $('tbody').empty();
            displayedPackets.forEach(packet => {
                let username = Users.find((user) => user.ID === packet.UserID).Username;
                let statusHtml = packet.Status === 1 ?
                    `<div id="active">
                    <span>Onaylanmış</span> <i class="fa fa-check" aria-hidden="true"></i>
                </div>` :
                    packet.Status === 0 ?
                        `<div id="waiting">
                    <span>Bekliyor</span> <i class="fa fa-clock-o" aria-hidden="true"></i>
                </div>` :
                        `<div id="reject">
                    <span>Reddedilmiş</span> <i class="fa fa-times" aria-hidden="true"></i>
                </div>`;

                let packetHtml = packet.PacketType === 1 ?
                    "Adisyon" : "Barkod";
                let downloadUrl = `/Admin/DownloadReceipt?filePath=${packet.ReceiptImg}`;
                let tr =
                    `<tr>
                    <td>${username}</td>
                    <td><img src="${packet.ReceiptImg}" alt="Dekont" /></td>
                   <td><a id="downloadLink" href="${downloadUrl}">indir</a></td>
                    <td>${formatDate(packet.BoughtTime)}</td>
                    <td>${packet.BoughtIP}</td>
                    <td>${packetHtml}</td>
                    <td>${statusHtml}</td>
                    <td>${packet.Price}TL</td>
                    <td>${packet.Note}</td>
                </tr>`;

                $('tbody').append(tr);
            });

            createPaginationButtons(Math.ceil(packets.length / itemsPerPage), page);
        }
        catch (e) {
            console.error(e);
        }
        
    }
});
