using Barcode_Restaurant.Models;
using Microsoft.IdentityModel.Tokens;
using MimeKit;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Web;
using System.Web.Mvc;

namespace Barcode_Restaurant.Controllers
{
    public class AdminAuthController : Controller
    {
        private readonly BarcodeRestoEntities _context;
        public AdminAuthController()
        {
            _context = new BarcodeRestoEntities();
        }




        private void AddJwtCookie(string token)
        {
            Response.Cookies["__a"].Value = token;
            Response.Cookies["__a"].HttpOnly = true;
            Response.Cookies["__a"].Secure = true;
            Response.Cookies["__a"].Expires = DateTime.Now.AddDays(1);
        }
        private string CreateToken(Admins admin)
        {

            var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(ConfigurationManager.AppSettings["SecretKey"]));
            var credentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, admin.Username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public ActionResult Login()
        {
            return View();

        }

        [HttpPost]
        public ActionResult LoginReq(string username, string password)
        {
            try
            {
                if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
                {
                    ViewBag.ErrorMessage = "Hatalı şifre veya kullanıcı adı!";
                    return View("Login");
                }
                var admin = _context.Admins.FirstOrDefault(x => x.Username == username);
                if (admin == null)
                {
                    ViewBag.ErrorMessage = "Hatalı şifre veya kullanıcı adı!";
                    return View("Login");
                }

                if (BCrypt.Net.BCrypt.Verify(password, admin.Password))
                {
                    AddJwtCookie(CreateToken(admin));
                    return RedirectToAction("Home", "Admin");

                }
                else
                {
                    ViewBag.ErrorMessage = "Hatalı şifre veya kullanıcı adı!";
                    return View("Login");
                }


            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = "Sunucu tarafında bir hata oluştu!";
                return View("Login");
            }
        }



        

    }
}