using Barcode_Restaurant.Models;
using MailKit.Net.Smtp;
using Microsoft.IdentityModel.Tokens;
using MimeKit;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Helpers;
using System.Web.Mvc;
using System.Web.Services.Description;
using static Org.BouncyCastle.Crypto.Engines.SM2Engine;

namespace Barcode_Restaurant.Controllers
{
    public class AdminController : Controller
    {
        
        private readonly BarcodeRestoEntities _context;

        public AdminController()
        {
            _context = new BarcodeRestoEntities();
        }



        private Admins ValidateToken(string token)
        {
            var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(ConfigurationManager.AppSettings["SecretKey"]));
            var tokenHandler = new JwtSecurityTokenHandler();

            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = secretKey,
                ValidateIssuer = false,
                ValidateAudience = false,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            var username = jwtToken.Subject;

            var admin = _context.Admins.FirstOrDefault(u => u.Username == username);
            return admin;
        }
        private bool AdminIsAuthenticated()
        {
            try
            {
                string token = Request.Cookies["__a"]?.Value;

                if (string.IsNullOrEmpty(token))
                {
                    return false;
                }

                var admin = ValidateToken(token);

                if (admin == null)
                {
                    return false;
                }


                return true;
            }
            catch (Exception ex)
            {

                return false;
            }
        }


        public void SendEmail(Users user, string textBody, string subject, string email )
        {
            MimeMessage mimeMessage = new MimeMessage();
            MailboxAddress mailboxAddressFrom = new MailboxAddress("procashier.com.tr", "procashiertr@gmail.com");
            MailboxAddress mailboxAddressTo = new MailboxAddress(user.Name , email);


            mimeMessage.From.Add(mailboxAddressFrom);
            mimeMessage.To.Add(mailboxAddressTo);

            var bodyBuilder = new BodyBuilder();

            
            bodyBuilder.TextBody = textBody;
            mimeMessage.Body = bodyBuilder.ToMessageBody();
            mimeMessage.Subject = subject;



            SmtpClient client = new SmtpClient();
            client.Connect("smtp.gmail.com", 587, false);
            client.Authenticate("procashiertr@gmail.com", "lgjh xzkd nfxz tbml");
            client.Send(mimeMessage);
            client.Disconnect(true);
        }
        private Admins GetAdmin()
        {
            try
            {
                string token = Request.Cookies["__a"]?.Value;

                if (string.IsNullOrEmpty(token))
                {
                    return null;
                }

                var admin = ValidateToken(token);

                return admin;
            }
            catch (Exception ex)
            {

                return null;
            }
        }

        public ActionResult Home()
        {
            if (!AdminIsAuthenticated())
            {
                return RedirectToAction("Login", "AdminAuth");
            }
            
            var admin = GetAdmin();
            return View(admin);
        }


        [HttpGet]
        public ActionResult GetUsers()
        {
            try
            {
                var users = _context.Users
                    .Select(u => new
                    {
                        u.UserId,
                        u.Name,
                       
                        u.Username,
                        u.Email,
                        u.Status,

                    }).ToList();
                return Json(users, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {

                return RedirectToAction("Users");
            }
        }


        [HttpPut]
        public ActionResult MakeActiveUser(int? id)
        {
            try
            {
                if (!AdminIsAuthenticated())
                {
                    return RedirectToAction("Login", "AdminAuth");
                }

                var user = _context.Users.FirstOrDefault(u => u.UserId == id);
                if (user == null || id == null)
                {
                    return RedirectToAction("Users");
                }


                user.Status = 1;
                _context.SaveChanges();
                return View("Users");

            }
            catch (Exception ex)
            {

                return RedirectToAction("Users");
            }
        }

        public ActionResult Users()
        {
            if (!AdminIsAuthenticated())
            {
                return RedirectToAction("Login", "AdminAuth");
            }

            return View();
        }

        [HttpPost]
        public ActionResult ChangePasswordReq(int id, string email, string password1, string password2)
        {
            try
            {
                if (!AdminIsAuthenticated())
                {
                    return RedirectToAction("Login", "AdminAuth");
                }

                var user = _context.Users.FirstOrDefault(u => u.UserId == id);
                if (string.IsNullOrEmpty(password1) || string.IsNullOrEmpty(password2))
                {
                    ViewBag.ErrorMessage = "Şifre alanları boş bırakılamaz!";
                    return View("ChangeUserPassword", user);
                }


                if (user == null)
                {
                    ViewBag.ErrorMessage = "Kullanıcı bulunamadı!";
                    return View("ChangeUserPassword", user); 
                }

                if (password1 != password2)
                {
                    ViewBag.ErrorMessage = "Şifreler uyuşmuyor!";
                    return View("ChangeUserPassword", user);
                }

                user.Password = BCrypt.Net.BCrypt.HashPassword(password1);
                _context.SaveChanges();
                
                string tbody = "Şifreniz güncellenmiştir.\n " + "Yeni Şifreniz: " + password1;
                string sub = "procashier.com.tr Şifre Güncelleme";
                SendEmail(user, tbody, sub, email);

                ViewBag.SuccessMessage = "Şifre başarıyla değiştirildi!";
                return View("ChangeUserPassword", user);

            }
            catch (Exception ex)
            {
                var user = _context.Users.FirstOrDefault(u => u.UserId == id);
                if (user == null)
                {
                    ViewBag.ErrorMessage = "Kullanıcı bulunamadı!";
                    return View("ChangeUserPassword", user);
                }
                ViewBag.ErrorMessage = "Şifre değiştirilirken bir hata ile karşılaşıldı!";
                return View("ChangeUserPassword", user);
            }
        }
        public ActionResult ChangeUserPassword(int? id)
        {
            if (!AdminIsAuthenticated())
            {
                return RedirectToAction("Login", "AdminAuth");
            }

            var user = _context.Users.FirstOrDefault(u => u.UserId == id);

            if (user == null || id == null)
            {
                return RedirectToAction("Users", "Admin");
            }


            return View(user);
          
        }


        [HttpGet]
        public ActionResult GetBarcodeUsers()
        {
            try
            {
                DateTime now = DateTime.Now;

                var usersWithRemainingPackets = _context.Users
                    .Where(u => u.Packets.Any(p => p.PacketType == 0))
                    .Select(u => new
                    {
                        u.UserId,
                        u.Name,
                  
                        u.Username,
                        u.Email,
                        u.Status,
                        RemainingUsageTime = u.Packets
                            .Where(p => p.PacketType == 0)
                            .Select(p => p.RemainingUsageTime)
                            .FirstOrDefault(),
                        PacketStatus = u.Packets
                            .Where(p => p.PacketType == 0 && p.RemainingUsageTime > now)
                            .Any()
                    })
                    .ToList();

                return Json(usersWithRemainingPackets, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                // Hata durumunda bir hata mesajı döndür
                return Json(new { error = "Barcode kullanıcıları getirilirken bir hata oluştu." });
            }
        }



        public ActionResult BarcodeUsers()
        {
            if (!AdminIsAuthenticated())
            {
                return RedirectToAction("Login", "AdminAuth");
            }
          
            return View();

        }


        [HttpPut]
        public ActionResult IncreaseOneYear(int? id, FormCollection form)
        {
            try
            {
                if (!AdminIsAuthenticated())
                {
                    return RedirectToAction("Login", "AdminAuth");
                }

                int type = int.Parse(form["type"]);
                var packet = _context.Packets.FirstOrDefault(p => p.UserId == id && p.PacketType == type);
                var user = _context.Users.FirstOrDefault(u => u.UserId == id);
                if (packet == null || id == null || user == null)
                {
                    return RedirectToAction("BarcodeUsers");
                }
                
                packet.RemainingUsageTime = packet.RemainingUsageTime.AddYears(1);
                _context.SaveChanges();

                string tbody;
                string sub = "procashier.com.tr paket işlemleri";
                if (type == 0)
                {
                    tbody = "Barkod üyeliğiniz 1 yıl arttırılmıştır. Bol kazançlı günlerde kullanmanız dileğiyle..\n\n\n\n\n\n Sevgiler,\n" + "Pro Cashier Ekibi";
                }
                else
                {
                    tbody = "Adisyon üyeliğiniz 1 yıl arttırılmıştır. Bol kazançlı günlerde kullanmanız dileğiyle..\n\n\n\n\n\n Sevgiler,\n" + "Pro Cashier Ekibi";
                }
               
                SendEmail(user, tbody, sub, user.Email);
                return RedirectToAction("BarcodeUsers");


            }
            catch (Exception ex)
            {
                return RedirectToAction("BarcodeUsers");
            }
        }
        [HttpPut]
        public ActionResult IncreaseSixMonths(int? id, FormCollection form)
        {
            try
            {
                if (!AdminIsAuthenticated())
                {
                    return RedirectToAction("Login", "AdminAuth");
                }
                int type = int.Parse(form["type"]);
                var packet = _context.Packets.FirstOrDefault(p => p.UserId == id && p.PacketType == type);
                var user = _context.Users.FirstOrDefault(u => u.UserId == id);
                if (packet == null || id == null || user == null)
                {
                    return RedirectToAction("BarcodeUsers");
                }

                packet.RemainingUsageTime = packet.RemainingUsageTime.AddMonths(6);
                _context.SaveChanges();



                string tbody;
                string sub = "procashier.com.tr paket işlemleri";
                if (type == 0)
                {
                    tbody = "Barkod üyeliğiniz 6 ay arttırılmıştır. Bol kazançlı günlerde kullanmanız dileğiyle..\n\n\n\n\n\n Sevgiler,\n" + "Pro Cashier Ekibi";
                }
                else
                {
                    tbody = "Adisyon üyeliğiniz 6 ay arttırılmıştır. Bol kazançlı günlerde kullanmanız dileğiyle..\n\n\n\n\n\n Sevgiler,\n" + "Pro Cashier Ekibi";
                }

                SendEmail(user, tbody, sub, user.Email);

                return RedirectToAction("BarcodeUsers");


            }
            catch (Exception ex)
            {
                return RedirectToAction("BarcodeUsers");
            }
        }
        [HttpPut]
        public ActionResult DecreaseOneYear(int? id, FormCollection form)
        {
            try
            {
                if (!AdminIsAuthenticated())
                {
                    return RedirectToAction("Login", "AdminAuth");
                }
                int type = int.Parse(form["type"]);
                var packet = _context.Packets.FirstOrDefault(p => p.UserId == id && p.PacketType == type);
                var user = _context.Users.FirstOrDefault(u => u.UserId == id);
                if (packet == null || id == null || user == null)
                {
                    return RedirectToAction("BarcodeUsers");
                }

                packet.RemainingUsageTime = packet.RemainingUsageTime.AddYears(-1);
                _context.SaveChanges();



                return RedirectToAction("BarcodeUsers");


            }
            catch (Exception ex)
            {
                return RedirectToAction("BarcodeUsers");
            }
        }
        [HttpPut]
        public ActionResult DecreaseSixMonths(int? id, FormCollection form)
        {
            try
            {
                if (!AdminIsAuthenticated())
                {
                    return RedirectToAction("Login", "AdminAuth");
                }
                int type = int.Parse(form["type"]);
                var packet = _context.Packets.FirstOrDefault(p => p.UserId == id && p.PacketType == type);
                var user = _context.Users.FirstOrDefault(u => u.UserId == id);
                if (packet == null || id == null || user == null)
                {
                    return RedirectToAction("BarcodeUsers");
                }

                packet.RemainingUsageTime = packet.RemainingUsageTime.AddMonths(-6);
                _context.SaveChanges();
                return RedirectToAction("BarcodeUsers");


            }
            catch (Exception ex)
            {
                return RedirectToAction("BarcodeUsers");
            }
        }


        [HttpGet]
        public ActionResult GetAdditionUsers()
        {
            try
            {
                DateTime now = DateTime.Now;

                var usersWithRemainingPackets = _context.Users
                    .Where(u => u.Packets.Any(p => p.PacketType == 1))
                    .Select(u => new
                    {
                        u.UserId,
                        u.Name,
                       
                        u.Username,
                        u.Email,
                        u.Status,
                        RemainingUsageTime = u.Packets
                            .Where(p => p.PacketType == 1)
                            .Select(p => p.RemainingUsageTime)
                            .FirstOrDefault(),
                        PacketStatus = u.Packets
                            .Where(p => p.PacketType == 1 && p.RemainingUsageTime > now)
                            .Any()
                    })
                    .ToList();

                return Json(usersWithRemainingPackets, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                // Hata durumunda bir hata mesajı döndür
                return Json(new { error = "Barcode kullanıcıları getirilirken bir hata oluştu." });
            }
        }



        public ActionResult AdditionUsers()
        {
            if (!AdminIsAuthenticated())
            {
                return RedirectToAction("Login", "AdminAuth");
            }

            return View();

        }

        [HttpPut]
        public ActionResult CheckPayment(FormCollection form)
        {
            try
            {
                if (!AdminIsAuthenticated())
                {
                    return RedirectToAction("Login", "AdminAuth");
                }

                int boughtPacketId = int.Parse(form["boughtPacketId"]);
                int userId = int.Parse(form["userId"]);
                var boughtPacket = _context.BoughtPacket.FirstOrDefault(p => p.BoughtPacketId == boughtPacketId);
                if (boughtPacket == null)
                {
                    return RedirectToAction("Payments");
                }

                boughtPacket.Status = 1;
                boughtPacket.Note = form["note"];



                int type = int.Parse(form["type"]);
                var packet = _context.Packets.FirstOrDefault(p => p.UserId == userId && p.PacketType == type);
                var user = _context.Users.FirstOrDefault(u => u.UserId == userId);
                if (packet == null || user == null)
                {
                    return RedirectToAction("Payments");
                }

                packet.RemainingUsageTime = packet.RemainingUsageTime.AddYears(1);
                string tbody;
                string sub = "procashier.com.tr paket işlemleri";
                if (type == 0)
                {
                    tbody = "Barkod üyeliğiniz 1 yıl arttırılmıştır. Bol kazançlı günlerde kullanmanız dileğiyle..\n\n\n\n\n\n Sevgiler,\n" + "Pro Cashier Ekibi";
                }
                else
                {
                    tbody = "Adisyon üyeliğiniz 1 yıl arttırılmıştır. Bol kazançlı günlerde kullanmanız dileğiyle..\n\n\n\n\n\n Sevgiler,\n" + "Pro Cashier Ekibi";
                }

                SendEmail(user, tbody, sub, user.Email);


                _context.SaveChanges();

                return RedirectToAction("Payments");

            }
            catch (Exception ex)
            {

                return RedirectToAction("Payments");
            }



        }
        [HttpPut]
        public ActionResult RejectPayment(FormCollection form)
        {
            try
            {
                if (!AdminIsAuthenticated())
                {
                    return RedirectToAction("Login", "AdminAuth");
                }

                int boughtPacketId = int.Parse(form["boughtPacketId"]);
                int userId = int.Parse(form["userId"]);
                var boughtPacket = _context.BoughtPacket.FirstOrDefault(p => p.BoughtPacketId == boughtPacketId);
                if (boughtPacket == null)
                {
                    return RedirectToAction("Payments");
                }

                boughtPacket.Status = 2;
                boughtPacket.Note = form["note"];



                int type = int.Parse(form["type"]);
               
                var user = _context.Users.FirstOrDefault(u => u.UserId == userId);
                if ( user == null)
                {
                    return RedirectToAction("Payments");
                }

                
                string tbody;
                string sub = "procashier.com.tr paket işlemleri";
                if (type == 0)
                {
                    tbody = "Barkod paketi satın alma isteğiniz reddedilmiştir.\n\n" + "Nedeni: " + form["note"]  + " \n\n\n\n\n\n Sevgiler,\n" + "Pro Cashier Ekibi";
                }
                else
                {
                    tbody = "Adisyon paketi satın alma isteğiniz reddedilmiştir.\n\n" + "Nedeni: " + form["note"] + " \n\n\n\n\n\n Sevgiler,\n" + "Pro Cashier Ekibi";
                }

                SendEmail(user, tbody, sub, user.Email);


                _context.SaveChanges();

                return RedirectToAction("Payments");

            }
            catch (Exception ex)
            {

                return RedirectToAction("Payments");
            }
        }
        

        public ActionResult DownloadReceipt(string filePath)
        {
            // Dosya yolu alınır
            var FilePath = Server.MapPath("~" + filePath);

            // Dosya yoksa 404 hatası döndürülür
            if (!System.IO.File.Exists(FilePath))
            {
                return HttpNotFound();
            }

            // Dosya okunur ve kullanıcıya indirilmek üzere sunulur
            var fileBytes = System.IO.File.ReadAllBytes(FilePath);
            var fileExtension = System.IO.Path.GetExtension(FilePath);
            var mimeType = MimeMapping.GetMimeMapping(fileExtension);

            return File(fileBytes, mimeType, FilePath);
        }

        public ActionResult Payments()
        {

            if (!AdminIsAuthenticated())
            {
                return RedirectToAction("Login", "AdminAuth");
            }

            var boughtPackets = _context.BoughtPacket.Where(p => p.Status == 0).ToList();
            
            ViewBag.PacketInformations = _context.PacketInformations.ToList();


            return View(boughtPackets); 
        }


        [HttpGet]
        public ActionResult GetPaymentsHistory()
        {
            try
            {
                var users = _context.Users
                    .Select(u => new
                    {
                        u.UserId,
                        u.Name,
                        
                   
                        u.Email,
                        u.Status,

                    }).ToList();
                var boughtPackets = _context.BoughtPacket
                    .Select(p => new
                    {
                        p.BoughtPacketId,
                        p.UserId,
                        p.ReceiptImg,
                        p.BoughtTime,
                        p.BoughtIP,
                        p.PacketType,
                        p.Status,
                        p.Price,
                        p.Note
                        
                    }).ToList();

                var res = new
                {
                    Users = users,
                    BoughtPackets = boughtPackets
                };

                return Json(res, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {

                return RedirectToAction("PaymentsHistory");
            }
        }



        public ActionResult PaymentsHistory()
        {

            if (!AdminIsAuthenticated())
            {
                return RedirectToAction("Login", "AdminAuth");
            }

            
            return View();
        }
        public ActionResult MyPackets()
        {

            if (!AdminIsAuthenticated())
            {
                return RedirectToAction("Login", "AdminAuth");
            }
            var packets = _context.PacketInformations.Where(p => p.IsActive == 1).ToList();

            return View(packets);
        }
        public ActionResult AddPacket()
        {

            if (!AdminIsAuthenticated())
            {
                return RedirectToAction("Login", "AdminAuth");
            }


            return View();
        }

        [HttpPost]
        public ActionResult AddPacketReq(int packetType, int packetPrice, string packetDuration)
        {
            try
            {
                if (!AdminIsAuthenticated())
                {
                    return RedirectToAction("Login", "AdminAuth");
                }
                var packet = new PacketInformations
                {
                    PacketType = packetType,
                    PacketPrice = packetPrice,
                    PacketName = "1 Yıl",
                    IsActive = 1
                };

                _context.PacketInformations.Add(packet);
                _context.SaveChanges();
                return RedirectToAction("MyPackets");
            }
            catch (Exception ex)
            {

                return RedirectToAction("MyPackets");
            }

        }
        [HttpPost]
        public ActionResult DeletePacketReq(int infoId)
        {
            try
            {
                if (!AdminIsAuthenticated())
                {
                    return RedirectToAction("Login", "AdminAuth");
                }
                var packet = _context.PacketInformations.FirstOrDefault(p => p.InfoId == infoId);

                packet.IsActive = 0;
                _context.SaveChanges();
                return RedirectToAction("MyPackets");
            }
            catch (Exception ex)
            {

                return RedirectToAction("MyPackets");
            }
        }

        [HttpPost]
        public ActionResult AddMyCustomerReq(string customerName, HttpPostedFileBase customerImg)
        {
            try
            {
                int maxContentLength = 2 * 1024 * 1024;
                if (customerImg != null && customerImg.ContentLength > maxContentLength)
                {

                    ViewBag.ErrorMessage = "Dosya boyutu en fazla 2 mb olmalı";
                    return View("AddMyCustomer");
                }

                if (!AdminIsAuthenticated())
                {
                    return RedirectToAction("Login", "AdminAuth");
                }

                // Check if file is null or empty
                if (customerImg == null || customerImg.ContentLength == 0)
                {
                    ViewBag.ErrorMessage = "Hatalı Dosya: Dosya seçilmedi veya dosya boş.";
                    return View("AddMyCustomer");
                }
                // Continue with file processing if within limits
                string randomFileName = Path.GetRandomFileName();
                randomFileName = randomFileName.Replace(".", "");
                randomFileName = randomFileName.Substring(0, 8);
                string fileName = randomFileName + Path.GetExtension(customerImg.FileName);
                string filePath = Path.Combine(Server.MapPath("~/Content/Assets/Images/MyCustomers/"), fileName);
                customerImg.SaveAs(filePath);

              
                var customer = new MyCustomers
                {
                    CustomerImg = "/Content/Assets/Images/MyCustomers/" + fileName,
                    CustomerName = customerName
                };

                _context.MyCustomers.Add(customer);
                _context.SaveChanges();

                return RedirectToAction("AddMyCustomer", "Admin");
            }
            catch (HttpException ex)
            {
                // HTTP hatasını özel olarak yakalayın ve mesajı gösterin
                ViewBag.ErrorMessage = "Dosya yükleme sırasında bir HTTP hatası oluştu: ";
                return View("AddMyCustomer");
            }
            catch (IOException ex)
            {
                // IO hatasını özel olarak yakalayın ve mesajı gösterin
                ViewBag.ErrorMessage = "Dosya yükleme sırasında bir IO hatası oluştu: ";
                return View("AddMyCustomer");
            }
            catch (Exception ex)
            {
                // Diğer hataları genel olarak yakalayın ve mesajı gösterin
                ViewBag.ErrorMessage = "Dosya yükleme sırasında bir hata oluştu. Lütfen tekrar deneyin veya sistem yöneticinizle iletişime geçin." + ex;
                return View("AddMyCustomer");
            }
        }
        [HttpPost]
        public ActionResult DeleteMyCustomer(int customerId)
        {
            try
            {
                if (!AdminIsAuthenticated())
                {
                    return RedirectToAction("Login", "AdminAuth");
                }
                var myCustomer = _context.MyCustomers.FirstOrDefault(c => c.CustomerId == customerId);
                if (myCustomer == null)
                {
                    return RedirectToAction("MyCustomers");
                }
                string filePath = Server.MapPath(myCustomer.CustomerImg);
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }
                var customer = _context.MyCustomers.Remove(myCustomer);
                _context.SaveChanges();
                return RedirectToAction("MyCustomers");
            }
            catch (Exception ex)
            {

                return RedirectToAction("MyCustomers");
            }
        }
        public ActionResult AddMyCustomer()
        {

            if (!AdminIsAuthenticated())
            {
                return RedirectToAction("Login", "AdminAuth");
            }


            var myCustomers = _context.MyCustomers.ToList();
            return View(myCustomers);


        }
        public ActionResult MyCustomers()
        {

            if (!AdminIsAuthenticated())
            {
                return RedirectToAction("Login", "AdminAuth");
            }


            var myCustomers = _context.MyCustomers.ToList();
            return View(myCustomers);

           
        }
    }
}