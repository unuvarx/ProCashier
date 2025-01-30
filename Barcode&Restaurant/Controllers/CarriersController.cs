using Barcode_Restaurant.Models;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Web;
using System.Web.Mvc;

namespace Barcode_Restaurant.Controllers
{
    public class CarriersController : Controller
    {


        private readonly BarcodeRestoEntities _context;

        public CarriersController()
        {
            _context = new BarcodeRestoEntities();
        }
       


        private Carriers ValidateTokenCarrier(string token)
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

            var carrier = _context.Carriers.FirstOrDefault(u => u.Username == username && u.Status == 1);

            return carrier;
        }

        private Users ValidateTokenUser(string token)
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

                var user = ValidateTokenUser(token);

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
        private bool CarrierIsAuthenticated()
        {
            try
            {
                string token = Request.Cookies["_c"]?.Value;

                if (string.IsNullOrEmpty(token))
                {
                    return false;
                }

                var carrier = ValidateTokenCarrier(token);

                if (carrier == null)
                {
                    return false;
                }
                if (carrier.Status == 0)
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

                var user = ValidateTokenUser(token);

                return user;
            }
            catch (Exception ex)
            {

                return null;
            }
        }
        private bool IsRemainingResto()
        {
            try
            {

                var user = GetUser();
                if (user == null)
                {
                    return false;
                }

                var restoPacket = _context.Packets.FirstOrDefault(p => p.UserId == user.UserId && p.PacketType == 1);
                if (restoPacket == null)
                {
                    return false;
                }

                TimeSpan remainingRestoUsageTime = restoPacket.RemainingUsageTime - DateTime.Now;
                double remainingRestoSeconds = remainingRestoUsageTime.TotalSeconds;
                if (remainingRestoSeconds <= 1)
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


        [HttpPost]
        public ActionResult AddCarrierReq(string nameSurname, string username, string password)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }

                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var user = GetUser();

                if (user == null)
                {
                    return RedirectToAction("Login", "UserAuth");
                }

                var isUsernameExists = _context.Carriers.Any(c => c.Username == username && c.Status == 1);

                if (isUsernameExists)
                {
                    ViewBag.Message = "Bu kullanıcı adı zaten kullanılmaktadır!";
                }
                else
                {
                    var carrier = new Carriers
                    {
                        UserId = user.UserId,
                        NameSurname = nameSurname,
                        Username = username,
                        Password = password,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                        Status = 1,
                    };

                    _context.Carriers.Add(carrier);
                    _context.SaveChanges();
                    ViewBag.Message = "Kurye başarıyla eklendi.";
                    return RedirectToAction("AllCarriers", "Carriers");
                }

                return View("AddCarrier");
            }
            catch (Exception ex)
            {
                ViewBag.Message = "Kurye eklenirken bir hata ile karşılaşıldı!";
                return View("AddCarrier");
            }
        }


        public ActionResult AddCarrier()
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingResto())
            {
                return RedirectToAction("BuyPacket", "User");
            }
            return View();
        }

       
        public ActionResult AllCarriers()
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingResto())
            {
                return RedirectToAction("BuyPacket", "User");
            }

            
            return View();

        }
        public ActionResult UpdateCarrier(int? id)
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingResto())
            {
                return RedirectToAction("BuyPacket", "User");
            }

            var user = GetUser();

            var carrier = _context.Carriers.FirstOrDefault(c => c.UserId == user.UserId && c.CarrierId == id && c.Status == 1);
            if (carrier == null || id == null)
            {
                return RedirectToAction("AllCarriers", "Carriers");
            }

            ViewBag.Carrier = carrier;


            return View();
        }
        [HttpPost]
        public ActionResult UpdateCarrierReq(string nameSurname, string username, string password, int id)
        {

            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var user = GetUser();

                var carrier = _context.Carriers.FirstOrDefault(c => c.UserId == user.UserId && c.CarrierId == id && c.Status == 1);
                if (carrier == null)
                {
                    return RedirectToAction("AllCarriers", "Carriers");
                }
                var findUsername = _context.Carriers.FirstOrDefault(c => c.Username == username && c.CarrierId != id);


                if (findUsername != null)
                {
                    ViewBag.Message = "Bu kullanıcı adı zaten kullanılmaktadır!";
                    return View("UpdateCarrier");
                }
                carrier.NameSurname = nameSurname;
                carrier.Username = username;
                carrier.Password = password;
                ViewBag.Carrier = carrier;
                _context.SaveChanges();
                return RedirectToAction("AllCarriers", "Carriers");
               
            }
            catch (Exception ex)
            {
                ViewBag.Message = "Kurye güncellenirken bir hata oluştu!";
                return View("AllCarriers");
            }

        }



       

        [HttpPut]

        public ActionResult DeleteCarrier(int? id)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var user = GetUser();

                var carrier = _context.Carriers.FirstOrDefault(c => c.UserId == user.UserId && c.CarrierId == id && c.Status == 1);
                if (carrier == null)
                {
                    return RedirectToAction("AllCarriers", "Carriers");
                }
                carrier.Status = 0;
                _context.SaveChanges();

                return RedirectToAction("AllCarriers", "Carriers");
            }
            catch (Exception ex)
            {

                return RedirectToAction("AllCarriers", "Carriers");
            }

        }
        public ActionResult GetCarriers()
        {


            try
            {

                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var user = GetUser();


               
                var carriers = _context.Carriers
                    .Where(c => c.UserId == user.UserId && c.Status == 1)
                    .Select(x => new
                    {
                        x.CarrierId,
                        x.Username,
                        x.Password,
                        x.NameSurname,

                    })
                    .ToList();
                

                return Json(carriers, JsonRequestBehavior.AllowGet);


            }
            catch (Exception ex)
            {

                return View("AllCarriers");
            }


        }




        // ---------------------------- CARRIER PROCESS -------------------------------------

        private Carriers GetCarrier()
        {
            try
            {
                string token = Request.Cookies["_c"]?.Value;

                if (string.IsNullOrEmpty(token))
                {
                    return null;
                }

                var carrier = ValidateTokenCarrier(token);

                return carrier;
            }
            catch (Exception ex)
            {

                return null;
            }
        }
        private bool IsRemainingRestoToCarrier()
        {
            try
            {

                var carrier = GetCarrier();
                if (carrier == null)
                {
                    return false;
                }

                var restoPacket = _context.Packets.FirstOrDefault(p => p.UserId == carrier.UserId && p.PacketType == 1);
                if (restoPacket == null)
                {
                    return false;
                }

                TimeSpan remainingRestoUsageTime = restoPacket.RemainingUsageTime - DateTime.Now;
                double remainingRestoSeconds = remainingRestoUsageTime.TotalSeconds;
                if (remainingRestoSeconds <= 1)
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

        public ActionResult GetOrders()
        {
            try
            {
                if (!CarrierIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }

                if (!IsRemainingRestoToCarrier())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var carrier = GetCarrier();
                var orders = _context.PacketOrders
                    .Where(o => o.CarrierId == carrier.CarrierId && o.Status == 2)
                    .Select(x => new
                    {
                        
                        x.PacketOrderId,
                        x.CustomerId,
                        x.Orders,
                        x.OrderStartingDate,
                        x.OrderEndDate,
                        x.CardPaid,
                        x.CashPaid,
                        x.CustomerNote,
                        carrierName = carrier.NameSurname
                    })
                    .ToList();

                var customers = _context.Customers
                     .Where(o => o.UserId == carrier.UserId && o.Status == 1)
                     .Select(x => new
                     {
                         x.CustomerId,
                         x.NameSurname,
                         x.PhoneNumber,
                         x.Adress
                     })
                     .ToList();
                if (orders == null || carrier == null || customers == null)
                {
                    return View("Orders");
                }

                var res = new
                {
                    Customers = customers,
                    Orders = orders,
                    CarrierName = carrier.NameSurname

                };
                return Json(res, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {

                return View("Orders");
            }

        }
        public ActionResult Orders()
        {
            if (!CarrierIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }

            if (!IsRemainingRestoToCarrier())
            {
                return RedirectToAction("BuyPacket", "User");
            }

            return View();
        }


        [HttpPut]
        public ActionResult PayOrder(FormCollection form)
        {
            try
            {
                if (!CarrierIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }

                if (!IsRemainingRestoToCarrier())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var carrier = GetCarrier();
                var packetOrderId = Convert.ToInt32(form["packetOrderId"]);
                var packetOrder = _context.PacketOrders.FirstOrDefault(o => o.PacketOrderId == packetOrderId && o.CarrierId == carrier.CarrierId && o.Status == 2);
                if (packetOrder == null)
                {
                    return RedirectToAction("Orders", "Carriers");
                }
                packetOrder.Status = 3;
                packetOrder.OrderEndDate = DateTime.Now;
                packetOrder.CashPaid = form["cashPaid"];
                packetOrder.CardPaid = form["cardPaid"];
                _context.SaveChanges();

                return View("Orders");

            }
            catch (Exception ex)
            {

                return View("Orders");
            }
        }

        [HttpPut]
        public ActionResult GiveBackOrder(int? id)
        {
            try
            {
                if (!CarrierIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }

                if (!IsRemainingRestoToCarrier())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var carrier = GetCarrier();
              
                var packetOrder = _context.PacketOrders.FirstOrDefault(o => o.PacketOrderId == id && o.CarrierId == carrier.CarrierId && o.Status == 2);
                if (packetOrder == null)
                {
                    return RedirectToAction("Orders", "Carriers");
                }
                packetOrder.Status = 4;
                packetOrder.OrderEndDate = DateTime.Now;
                _context.SaveChanges();
                return View("Orders");
            }
            catch (Exception ex)
            {

                return View("Orders");
            }

        }
    }
}