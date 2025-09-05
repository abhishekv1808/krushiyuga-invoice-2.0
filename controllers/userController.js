exports.getHome = (req, res, next) => {
    res.render('../views/user/home.ejs', {
        pageTitle: "Krushiyuga Invoice Management | Home",
        adminEmail: req.session.adminEmail || null
    });
};