using Barcode_Restaurant.Models;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Web;
using System.Web.Helpers;
using System.Web.Mvc;

using MimeKit;
using MailKit.Net.Smtp;
using static Org.BouncyCastle.Crypto.Engines.SM2Engine;
using System.CodeDom;
using Newtonsoft.Json;
using System.Net;
using System.IO;
using System.Security.Cryptography;





namespace Barcode_Restaurant.Controllers
{
    public class UserAuthController : Controller
    {
        private readonly BarcodeRestoEntities _context;
        public UserAuthController()
        {
            _context = new BarcodeRestoEntities();
        }

        private void AddJwtCookie(string token)
        {
            Response.Cookies["_u"].Value = token;
            Response.Cookies["_u"].HttpOnly = true;
            Response.Cookies["_u"].Secure = true;
            Response.Cookies["_u"].Expires = DateTime.Now.AddDays(7);
        }

        private string CreateToken(Users user)
        {
            var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(ConfigurationManager.AppSettings["SecretKey"]));
            var credentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
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
        public ActionResult Login()
        {
            return View();
        }

        public class CaptchaResponse
        {
            [JsonProperty("success")]
            public string Success { get; set; }

            [JsonProperty("error-codes")]
            public List<string> ErrorCodes { get; set; }
        }
        private bool ValidateCaptcha(string response)
        {
            
            string secret = ConfigurationManager.AppSettings["GoogleSecretkey"];

            var client = new WebClient();
            var reply = client.DownloadString(string.Format("https://www.google.com/recaptcha/api/siteverify?secret={0}&response={1}", secret, response));

            var captchaResponse = JsonConvert.DeserializeObject<CaptchaResponse>(reply);

            return Convert.ToBoolean(captchaResponse.Success);

        }
        public ActionResult Register()
        {

            ViewBag.GoogleSiteKey = ConfigurationManager.AppSettings["GoogleSiteKey"];
            return View();
        }
        public ActionResult VerifyEmail()
        {
            return View();
        }

        [HttpPost]
        public ActionResult RegisterReq(string name, string email,string phoneNumber, string username, string password, string password2)
        {
            

            try
            {
                bool isCapthcaValid = !string.IsNullOrEmpty(Request["g-recaptcha-response"]) && ValidateCaptcha(Request["g-recaptcha-response"]);
                if (!isCapthcaValid)
                {
                    ViewBag.ErrorMessage = "reCAPTCHA doğrulaması başarısız!";
                    return View("Register");
                }
                if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
                {
                    ViewBag.ErrorMessage = "Kullanıcı adı veya şifre alanı boş!";
                    return View("Register");
                }

                if (_context.Users.Any(u => u.Username == username || u.Email == email))
                {
                    ViewBag.ErrorMessage = "Kullanıcı adı veya email zaten kullanımda!";
                    return View("Register");
                }

                if (password != password2)
                {
                    ViewBag.ErrorMessage = "Şifreler uyuşmuyor!";
                    return View("Register");
                }
                DateTime now = DateTime.Now;

                
                DateTime sevenDaysLater = now.AddDays(7);
                Random random = new Random();
                int code = random.Next(100000, 1000000);
                var user = new Users
                {
                    Name = name,
                    
                    Email = email,
                    PhoneNumber = phoneNumber,
                    Username = username,
                    Password = BCrypt.Net.BCrypt.HashPassword(password),
                    RemainingUsageTime = sevenDaysLater,
                    ConfirmCode = code,
                    Status = 0,
                };
                
                var barcodePacket = new Packets
                {
                    UserId = user.UserId,
                    PacketType = 0,
                    RemainingUsageTime = sevenDaysLater,
                    DayStartTime = TimeSpan.Parse("06:45"), 
                    DayEndTime = TimeSpan.Parse("23:45")  

                };
                var restoPacket = new Packets
                {
                    UserId = user.UserId,
                    PacketType = 1,
                    RemainingUsageTime = sevenDaysLater,
                    DayStartTime = TimeSpan.Parse("06:45"),  
                    DayEndTime = TimeSpan.Parse("23:45")

                };
                _context.Packets.Add(barcodePacket);
                _context.Packets.Add(restoPacket);

                _context.Users.Add(user);
                _context.SaveChanges();



                

                MimeMessage mimeMessage = new MimeMessage();
                MailboxAddress mailboxAddressFrom = new MailboxAddress("procashier.com.tr", "procashiertr@gmail.com");
                MailboxAddress mailboxAddressTo = new MailboxAddress(user.Name, email);


                mimeMessage.From.Add(mailboxAddressFrom);
                mimeMessage.To.Add(mailboxAddressTo);

                var bodyBuilder = new BodyBuilder();

                bodyBuilder.TextBody = "Merhaba,\n\n\n\n " + "Hesabınızı onaylamak için onay kodunuz: " + code + "\n\n\nSevgiler,\n\n\n\n Pro Cashier Ekibi";
                mimeMessage.Body = bodyBuilder.ToMessageBody();
                mimeMessage.Subject = "procashier.com.tr Onay Kodu";

                SmtpClient client = new SmtpClient();
                client.Connect("smtp.gmail.com", 587, false);
                client.Authenticate("procashiertr@gmail.com", "lgjh xzkd nfxz tbml");
                client.Send(mimeMessage);
                client.Disconnect(true);


                return RedirectToAction("VerifyEmail", "UserAuth");
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = "Şüpheli işlem!" + ex;
                return View("Register");
                
            }
        }
        [HttpPost]
        public ActionResult LoginReq(string username, string password)
        {
            try
            {
                if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
                {
                    ViewBag.ErrorMessage = "Kullanıcı adı veya şifre alanı boş";
                    return View("Login");
                }
                var user = _context.Users.FirstOrDefault(u => u.Username == username);
                if (user == null)
                {
                    ViewBag.ErrorMessage = "Hatalı şifre veya kullanıcı adı!";
                    return View("Login");
                }
                if (user.Status == 0 && BCrypt.Net.BCrypt.Verify(password, user.Password))
                {
                    return RedirectToAction("VerifyEmail", "UserAuth");
                }

                else if (BCrypt.Net.BCrypt.Verify(password, user.Password) && user.Status == 1)
                {
                    AddJwtCookie(CreateToken(user));
                    return RedirectToAction("Packets", "User");
                }
                else
                {
                    ViewBag.ErrorMessage = "Hatalı şifre veya kullanıcı adı!";
                    return View("Login");
                }
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = "Şüpheli işlem!";
                return View("Login");
            }
        }


        [HttpPost]
        public ActionResult LogoutReq()
        {
            try
            {
                if (Request.Cookies["_u"] != null)
                {
                    var c = new HttpCookie("_u");
                    c.Expires = DateTime.Now.AddDays(-1);
                    Response.Cookies.Add(c);
                }

               
                return RedirectToAction("Login", "UserAuth");
            }
            catch (Exception ex)
            {
                return RedirectToAction("Login", "UserAuth");
            }
        }

        [HttpPost]
        public ActionResult VerifyEmailReq(string code)
        {
            try
            {
                var user = _context.Users.FirstOrDefault(u => u.ConfirmCode.ToString() == code);
                if (user == null)
                {
                    ViewBag.ErrorMessage = "Hatalı onay kodu!";
                    return View("VerifyEmail");
                }
                if (user.Status == 1)
                {
                    ViewBag.ErrorMessage = "Hesap zaten onaylanmış!";
                    return View("VerifyEmail");
                }
                user.Status = 1;
                _context.SaveChanges();
                ViewBag.SuccessMessage = "Hesabınız başarıyla onaylandı!";
                return View("VerifyEmail");
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = "Şüpheli işlem!";
                return View("VerifyEmail");
            }
        }
        public ActionResult SendRestartPassword()
        {
            return View();
        }

        public static class Base64UrlEncoder
        {
            public static string ToBase64UrlString(byte[] bytes)
            {
                string base64 = Convert.ToBase64String(bytes);
                return base64.TrimEnd('=').Replace('+', '-').Replace('/', '_');
            }

            public static byte[] FromBase64UrlString(string base64Url)
            {
                string base64 = base64Url.Replace('-', '+').Replace('_', '/');
                switch (base64.Length % 4)
                {
                    case 2: base64 += "=="; break;
                    case 3: base64 += "="; break;
                }
                return Convert.FromBase64String(base64);
            }
        }
        public static class AesEncryption
        {
            private static readonly string key = ConfigurationManager.AppSettings["EncryptionKey"];
            private static readonly string iv = ConfigurationManager.AppSettings["InitializationVector"];

            public static string Encrypt(string plainText)
            {
                using (Aes aes = Aes.Create())
                {
                    aes.Key = Encoding.UTF8.GetBytes(key);
                    aes.IV = Encoding.UTF8.GetBytes(iv);

                    ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV);

                    using (MemoryStream ms = new MemoryStream())
                    {
                        using (CryptoStream cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
                        {
                            using (StreamWriter sw = new StreamWriter(cs))
                            {
                                sw.Write(plainText);
                            }
                        }
                        return Base64UrlEncoder.ToBase64UrlString(ms.ToArray());
                    }
                }
            }

            public static string Decrypt(string cipherText)
            {
                using (Aes aes = Aes.Create())
                {
                    aes.Key = Encoding.UTF8.GetBytes(key);
                    aes.IV = Encoding.UTF8.GetBytes(iv);

                    ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV);

                    using (MemoryStream ms = new MemoryStream(Base64UrlEncoder.FromBase64UrlString(cipherText)))
                    {
                        using (CryptoStream cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read))
                        {
                            using (StreamReader sr = new StreamReader(cs))
                            {
                                return sr.ReadToEnd();
                            }
                        }
                    }
                }
            }
        }


        public class TokenData
        {
            public int UserId { get; set; }
            public DateTime Expiry { get; set; }
        }

        public string GenerateToken(string tokenJson)
        {
            return BCrypt.Net.BCrypt.HashPassword(tokenJson);
        }

        public bool IsTokenValid(string info, string token)
        {
            try
            {
                string decrypted = AesEncryption.Decrypt(info);
                var json = JsonConvert.DeserializeObject<TokenData>(decrypted);

                // Doğrudan hash doğrulaması yapmak yerine token'ın valid olup olmadığını kontrol etmelisiniz.
                if (BCrypt.Net.BCrypt.Verify(decrypted, token))
                {
                    if (DateTime.UtcNow < json.Expiry)
                    {
                        return true;
                    }
                }
                return false;
            }
            catch
            {
                return false;
            }
        }


        [HttpPost]
        public ActionResult ResetPasswordReq(string email)
        {
           try
            {
                var user = _context.Users.FirstOrDefault(u => u.Email == email);
                if (user == null)
                {
                    ViewBag.ErrorMessage = "Kullanıcı bulunamadı!";
                    return View("SendRestartPassword");
                }
                var tokenData = new TokenData
                {
                    UserId = user.UserId,
                    Expiry = DateTime.UtcNow.AddSeconds(90)
                };
                int id = user.UserId;
                string tokenJson = JsonConvert.SerializeObject(tokenData);
                string token = GenerateToken(tokenJson);
                string encrypted = AesEncryption.Encrypt(tokenJson);
                string decrypted = AesEncryption.Decrypt(encrypted);
                string url = $"https://procashier.com.tr/UserAuth/ResetPassword?token={token}&info={encrypted}";

                MimeMessage mimeMessage = new MimeMessage();
                MailboxAddress mailboxAddressFrom = new MailboxAddress("procashier.com.tr destek", "procashiertr@gmail.com");
                MailboxAddress mailboxAddressTo = new MailboxAddress(user.Name, email);


                mimeMessage.From.Add(mailboxAddressFrom);
                mimeMessage.To.Add(mailboxAddressTo);

                var bodyBuilder = new BodyBuilder();

                bodyBuilder.TextBody = "Şifrenizi değiştirmek için lütfen linke tıklayınız: " + url + "\n\n\n\n" + "Bu url 90 saniye sonra sıfırlanacak!\n\n\n\n Sevgiler\nProCashier Ekibi";
                mimeMessage.Body = bodyBuilder.ToMessageBody();
                mimeMessage.Subject = "procashier.com.tr Şifre Güncelleme";

                SmtpClient client = new SmtpClient();
                client.Connect("smtp.gmail.com", 587, false);
                client.Authenticate("procashiertr@gmail.com", "lgjh xzkd nfxz tbml");
                client.Send(mimeMessage);
                client.Disconnect(true);



                ViewBag.SuccessMessage = "Şifre değiştirme linki mail adresinize gönderildi!";
                return View("SendRestartPassword");

            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = "Şüpheli işlem!";
                return View("SendRestartPassword");
            }
        }

        
        public ActionResult ResetPassword(string token, string info)
        {
            
            try
            {
                if (!IsTokenValid(info, token))
                {
                    ViewBag.ErrorMessage = "Geçersiz veya süresi dolmuş url!";
                    return View();
                }
                else if (IsTokenValid(info, token))
                {
                    string decrypted = AesEncryption.Decrypt(info);
                    var json = JsonConvert.DeserializeObject<TokenData>(decrypted);
                    ViewBag.UserId = json.UserId;
                    ViewBag.Token = token;
                    return View();
                }
                else
                {
                    ViewBag.ErrorMessage = "Hatalı token!";
                    return View();
                }

            }
            catch (Exception ex)
            {

                ViewBag.ErrorMessage = "Sunucu tarafında bir hata ile karşılaşıldı!";
                return View();
            }
            
        }

        [HttpPost]
        public ActionResult ChangePassword( string password1, string password2, string userId)
        {
            try
            {
                var user = _context.Users.FirstOrDefault(u => u.UserId.ToString() == userId);
                if (password1 != password2)
                {
                    ViewBag.ErrorMessage = "Şifreler uyuşmuyor!";
                    return View("ResetPassword");
                }
                if (user != null)
                {
                    user.Password = BCrypt.Net.BCrypt.HashPassword(password2);
                    _context.SaveChanges();
                    ViewBag.SuccessMessage = "Şifreniz başarıyla güncellendi!";
                    return View("ResetPassword");
                }
                ViewBag.ErrorMessage = "Şüpheli işlem!";
                return View("ResetPassword");
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = "Şüpheli işlem!";
                return View("ResetPassword");
            }
        }



        // --------------------------- WAITER --------------------------------
        private void AddJwtCookieToWaiter(string token)
        {
            Response.Cookies["_w"].Value = token;
            Response.Cookies["_w"].HttpOnly = true;
            Response.Cookies["_w"].Secure = true;
            Response.Cookies["_w"].Expires = DateTime.Now.AddDays(1);
        }

        private string CreateTokenToWaiter(Waiters waiter)
        {
            var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(ConfigurationManager.AppSettings["SecretKey"]));
            var credentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, waiter.Username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
        [HttpPost]
        public ActionResult LoginWaiterReq(string waiterUsername, string waiterPassword)
        {
            try
            {
                var waiter = _context.Waiters.FirstOrDefault(u => u.Username == waiterUsername && u.Status == 1);
                if (string.IsNullOrEmpty(waiterUsername) || string.IsNullOrEmpty(waiterPassword))
                {
                    ViewBag.ErrorMessage = "Kullanıcı adı veya şifre alanı boş";
                    return View("Login");
                }
                if (waiter == null)
                {
                    ViewBag.ErrorMessage = "Hatalı şifre veya kullanıcı adı!";
                    return View("Login");
                }

                else if (BCrypt.Net.BCrypt.Verify(waiterPassword, waiter.PasswordHash) && waiter.Status == 1)
                {
                    AddJwtCookieToWaiter(CreateTokenToWaiter(waiter));
                    return RedirectToAction("Tables", "Waiters");
                }
                else
                {
                    ViewBag.ErrorMessage = "Hatalı şifre veya kullanıcı adı!";
                    return View("Login");
                }
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = "Şüpheli işlem!";
                return View("Login");
            }
        }
        // --------------------------- CARRIER --------------------------------

        private void AddJwtCookieToCarrier(string token)
        {
            Response.Cookies["_c"].Value = token;
            Response.Cookies["_c"].HttpOnly = true;
            Response.Cookies["_c"].Secure = true;
            Response.Cookies["_c"].Expires = DateTime.Now.AddDays(7);
        }

        private string CreateTokenToCarrier(Carriers carrier)
        {
            var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(ConfigurationManager.AppSettings["SecretKey"]));
            var credentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, carrier.Username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [HttpPost]
        public ActionResult LoginCarrierReq(string carrierUsername, string carrierPassword)
        {
            try
            {
                var carrier = _context.Carriers.FirstOrDefault(u => u.Username == carrierUsername && u.Status == 1);
                if (string.IsNullOrEmpty(carrierUsername) || string.IsNullOrEmpty(carrierPassword))
                {
                    ViewBag.ErrorMessage = "Kullanıcı adı veya şifre alanı boş";
                    return View("Login");
                }
                if (carrier == null)
                {
                    ViewBag.ErrorMessage = "Hatalı şifre veya kullanıcı adı!";
                    return View("Login");
                }

                else if (BCrypt.Net.BCrypt.Verify(carrierPassword, carrier.PasswordHash) && carrier.Status == 1)
                {
                    AddJwtCookieToCarrier(CreateTokenToCarrier(carrier));
                    return RedirectToAction("Orders", "Carriers");
                }
                else
                {
                    ViewBag.ErrorMessage = "Hatalı şifre veya kullanıcı adı!";
                    return View("Login");
                }
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = "Şüpheli işlem!";
                return View("Login");
            }
        }
    }
}