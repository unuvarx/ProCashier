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
using System.Net;
using System.Text;
using System.Web;
using System.Web.Helpers;
using System.Web.Mvc;

namespace Barcode_Restaurant.Controllers
{
    public class UserController : Controller
    {
        private readonly BarcodeRestoEntities _context;
        public UserController()
        {
            _context = new BarcodeRestoEntities();
        }
        private Users ValidateToken(string token)
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
            var user = _context.Users.FirstOrDefault(u => u.Username == username);
            return user;
        }
        private bool UserIsAuthenticated()
        {
            try
            {
                string token = Request.Cookies["_u"]?.Value;

                if (string.IsNullOrEmpty(token))
                {
                    return false;
                }

                var user = ValidateToken(token);

                if (user == null)
                {
                    return false;
                }
                if (user.Status == 0)
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
        private Users GetUser()
        {
            try
            {
                string token = Request.Cookies["_u"]?.Value;

                if (string.IsNullOrEmpty(token))
                {
                    return null;
                }

                var user = ValidateToken(token);

                return user;
            }
            catch (Exception ex)
            {
                
                return null;
            }
        }

        public void SendEmail(Users user, string textBody, string subject, string email)
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
        public  ActionResult Profile()
        {

            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            var user = GetUser();
            ViewBag.User = user;

            return View();
        }
        public ActionResult Packets()
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }

            var user = GetUser();

            // barcode = 0; resto = 1;
            var barcodePacket = _context.Packets.FirstOrDefault(p => p.UserId == user.UserId && p.PacketType == 0);
            var restoPacket = _context.Packets.FirstOrDefault(p => p.UserId == user.UserId && p.PacketType == 1);

            // Remaining usage time calculation for barcodePacket
            if (barcodePacket != null && restoPacket != null)
            {
                TimeSpan remainingBarcodeUsageTime = barcodePacket.RemainingUsageTime - DateTime.Now;
                double remainingBarcodeSeconds = remainingBarcodeUsageTime.TotalSeconds;

                // Remaining usage time calculation for restoPacket
                TimeSpan remainingRestoUsageTime = restoPacket.RemainingUsageTime - DateTime.Now;
                double remainingRestoSeconds = remainingRestoUsageTime.TotalSeconds;

                ViewBag.User = user;
                ViewBag.BarcodePacket = barcodePacket;
                ViewBag.RestoPacket = restoPacket;

                // Adding remaining usage time in seconds to ViewBag
                ViewBag.BarcodeStatus = remainingBarcodeSeconds > 0 ? "Aktif" : "Pasif";
                ViewBag.RestoStatus = remainingRestoSeconds > 0 ? "Aktif" : "Pasif";

                // Calculating finish times for Barcode and Resto packets
                DateTime barcodeFinishTime = DateTime.Now.Add(remainingBarcodeUsageTime);
                DateTime restoFinishTime = DateTime.Now.Add(remainingRestoUsageTime);

                // Adding finish times to ViewBag in the format of day/month/year
                ViewBag.BarcodeFinishTime = barcodeFinishTime.ToString("dd/MM/yyyy");
                ViewBag.RestoFinishTime = restoFinishTime.ToString("dd/MM/yyyy");
            }

            return View();
        }




        public ActionResult BuyPacket()
        {

            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            var user = GetUser();
            ViewBag.User = user;

            return View();
        }

        [HttpPost]
        public ActionResult BuyPacketReq(string infoId, HttpPostedFileBase receipt)
        {
            try
            {
                int maxContentLength = 1 * 1024 * 1024;
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
                var fileExtension = Path.GetExtension(receipt.FileName).ToLower();
                var user = GetUser();
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (receipt != null && receipt.ContentLength > maxContentLength)
                {
                    ViewBag.ErrorMessage = "Maksimum dosya boyutu 1 mb olmalıdır!";
                    ViewBag.User = user;
                    return View("BuyPacket");
                }
                if (receipt != null && !allowedExtensions.Contains(fileExtension))
                {
                    TempData["ErrorMessage"] = "Geçersiz dosya türü. Yalnızca .jpg, .jpeg, .png ve .pdf dosyaları yükleyebilirsiniz.";
                    return RedirectToAction("Menu", "Reckoning");
                }
                string userIPAddress = HttpContext.Request.UserHostAddress;
                if (receipt== null || receipt.ContentLength == 0)
                {
                    ViewBag.ErrorMessage = "İşleminiz başarısız oldu!";
                    ViewBag.User = user;
                    return View("BuyPacket");
                }
                int InfoId = Convert.ToInt32(infoId);
                var packet = _context.PacketInformations.FirstOrDefault(p => p.InfoId == InfoId);
                var findedPacket = _context.BoughtPacket.FirstOrDefault(p => p.UserId == user.UserId && p.InfoId == InfoId && p.Status == 0);
                if (findedPacket != null)
                {
                    ViewBag.ErrorMessage = "Henüz onaylanmamış bir paket alım işleminiz zaten bulunuyor!";
                    ViewBag.User = user;
                    return View("BuyPacket");
                }


                string randomFileName = Path.GetRandomFileName();
                randomFileName = randomFileName.Replace(".", "");
                randomFileName = randomFileName.Substring(0, 8);
                string fileName = randomFileName + Path.GetExtension(receipt.FileName);
                string filePath = Path.Combine(Server.MapPath("~/Content/Assets/Images/Receipts/"), fileName);

                receipt.SaveAs(filePath);

               
                var boughtPacket = new BoughtPacket
                {
                    UserId = user.UserId,
                    ReceiptImg = "/Content/Assets/Images/Receipts/" + fileName,
                    BoughtTime = DateTime.Now,
                    BoughtIP = userIPAddress,
                    InfoId = InfoId,
                    PacketType = packet.PacketType,
                    Status = 0,
                    Price = Convert.ToInt32(packet.PacketPrice),
                
                };


                _context.BoughtPacket.Add(boughtPacket);
                _context.SaveChanges();
                ViewBag.SuccessMessage = "İşleminiz başarılı bir şekilde alınmıştır";
                ViewBag.User = user;
                string tbody = "Sayın Sefa Ünüvar,\n " + "Yeni bir ödeme gelmiştir ";
                string sub = "procashier.com.tr gelen ödeme";
                SendEmail(user, tbody, sub, user.Email);
                return View("BuyPacket");
            }
            catch (Exception ex)
            {
                var user = GetUser();
                ViewBag.ErrorMessage = ex;
                ViewBag.User = user;
                return View("BuyPacket");
            }
        }


        [HttpPut]
        public ActionResult ChangePacketTime(FormCollection form)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                var user = GetUser();

                int packetId = int.Parse(form["packetId"]);
                var packet = _context.Packets.FirstOrDefault(p => p.PacketId == packetId);
                if (packet == null)
                {
                    return RedirectToAction("Packets", "User");
                }

                packet.DayStartTime = TimeSpan.Parse(form["startTime"]);
                packet.DayEndTime = TimeSpan.Parse(form["endTime"]);

                _context.SaveChanges();
                
                return RedirectToAction("Packets", "User");
            }
            catch (Exception ex)
            {
                return RedirectToAction("Packets", "User");
            }
        }



        public ActionResult PacketHistory()
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            var user = GetUser();

            var boughtPackets = _context.BoughtPacket.Where(p => p.UserId == user.UserId).ToList();
            ViewBag.PacketInformations = _context.PacketInformations.ToList();
            ViewBag.User = user;
            return View(boughtPackets);

        }
        private string GetFilePath(string fileName)
        {
            // Dosya yolu, örneğin "App_Data" klasörü
            return Server.MapPath("~/Content/Assets/" + fileName);
        }

        public ActionResult DownloadDriver(string fileName)
        {
            // Dosya yolu alınır
            var filePath = GetFilePath(fileName);

            // Dosya yoksa 404 hatası döndürülür
            if (!System.IO.File.Exists(filePath))
            {
                return HttpNotFound();
            }

            // Dosya okunur ve kullanıcıya indirilmek üzere sunulur
            var fileBytes = System.IO.File.ReadAllBytes(filePath);
            var fileExtension = System.IO.Path.GetExtension(filePath);
            var mimeType = MimeMapping.GetMimeMapping(fileExtension);

            return File(fileBytes, mimeType, fileName);
        }
        
        public ActionResult Printer()
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
           
            return View();

        }

        [HttpGet]
        public ActionResult GetPacketInformations()
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
               
                var packetInformations = _context.PacketInformations
                 .Where(p => p.IsActive == 1)
                 .Select(p => new
                 {
                     p.InfoId,
                     p.PacketType,
                     p.PacketPrice,
                     p.PacketName
                 })
                 .ToList();
                return Json(packetInformations, JsonRequestBehavior.AllowGet);
            }
            catch(Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }




       



    }
}