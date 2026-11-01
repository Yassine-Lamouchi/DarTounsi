<?php
/* ============================================
   DarTounsi v2 — Consolidated API
   Single endpoint handling all routes
   ============================================ */

error_reporting(E_ALL);
ini_set('display_errors', 0);
session_start();

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ---- Database Connection ----
define('DB_HOST', 'localhost');
define('DB_NAME', 'dartounsi');
define('DB_USER', 'root');
define('DB_PASS', '');
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('SUPER_ADMIN_EMAIL', 'yassine.lamouchi@dartounsi.tn');

// Returns a single PDO connection (static = created only once)
function getDB()
{
    static $pdo = null;
    if (!$pdo) {
        try {
            $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);
        } catch (PDOException $e) {
            res(500, ['message' => 'Database connection failed']);
        }
    }
    return $pdo;
}

// ---- Helper Functions ----
function res($code, $data)
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function body()
{
    return json_decode(file_get_contents('php://input'), true) ?: [];
}
function method()
{
    return $_SERVER['REQUEST_METHOD'];
}
function param($k, $d = null)
{
    return isset($_GET[$k]) ? trim($_GET[$k]) : $d;
}
function san($s)
{
    return htmlspecialchars(trim($s), ENT_QUOTES, 'UTF-8');
}
function validEmail($e)
{
    return filter_var($e, FILTER_VALIDATE_EMAIL) !== false;
}

// Returns user_id from session or sends 401
function auth()
{
    if (empty($_SESSION['user_id'])) res(401, ['message' => 'Authentication required']);
    return $_SESSION['user_id'];
}

// Checks if user has one of the required roles
function requireRole($roles)
{
    $uid = auth();
    $db = getDB();
    $s = $db->prepare('SELECT role FROM users WHERE id = ?');
    $s->execute([$uid]);
    $u = $s->fetch();
    if (!$u || !in_array($u['role'], (array)$roles)) res(403, ['message' => 'Access denied']);
    return $uid;
}

// Checks if a user is super_admin
function isSuperAdmin($userId = null)
{
    $uid = $userId ?: ($_SESSION['user_id'] ?? 0);
    $db = getDB();
    $s = $db->prepare('SELECT role FROM users WHERE id = ?');
    $s->execute([$uid]);
    $u = $s->fetch();
    return $u && $u['role'] === 'super_admin';
}

// Checks if a user is admin or super_admin
function isAdminOrSuper($userId = null)
{
    $uid = $userId ?: ($_SESSION['user_id'] ?? 0);
    $db = getDB();
    $s = $db->prepare('SELECT role FROM users WHERE id = ?');
    $s->execute([$uid]);
    $u = $s->fetch();
    return $u && in_array($u['role'], ['admin', 'super_admin']);
}

// Paginates a SQL query and returns data + pagination info
function paginate($query, $params, $page = 1, $perPage = 12)
{
    $db = getDB();
    $page = max(1, (int)$page);
    $offset = ($page - 1) * $perPage;
    // Count total rows using a subquery wrapper
    $baseQ = preg_replace('/ORDER BY .+$/i', '', $query);
    $cq = "SELECT COUNT(*) as total FROM ($baseQ) as count_tbl";
    $s = $db->prepare($cq);
    $s->execute($params);
    $total = $s->fetch()['total'];
    $query .= " LIMIT $perPage OFFSET $offset";
    $s = $db->prepare($query);
    $s->execute($params);
    return [
        'data' => $s->fetchAll(),
        'pagination' => [
            'page' => $page,
            'per_page' => $perPage,
            'total' => (int)$total,
            'total_pages' => (int)ceil($total / max(1, $perPage))
        ]
    ];
}

// Creates a notification for a user
function notify($userId, $type, $title, $message, $link = '')
{
    getDB()->prepare("INSERT INTO notifications (user_id, type, title, message, link) VALUES (?,?,?,?,?)")
        ->execute([$userId, $type, $title, $message, $link]);
}

// ---- Main Router ----
$route = param('route', '');
$action = param('action', '');

switch ($route) {
    case 'auth':
        routeAuth($action);
        break;
    case 'users':
        routeUsers($action);
        break;
    case 'properties':
        routeProperties($action);
        break;
    case 'rentals':
        routeRentals($action);
        break;
    case 'favorites':
        routeFavorites($action);
        break;
    case 'reviews':
        routeReviews($action);
        break;
    case 'messages':
        routeMessages($action);
        break;
    case 'notifications':
        routeNotifications($action);
        break;
    case 'admin':
        routeAdmin($action);
        break;
    case 'matchmaking':
        routeMatchmaking($action);
        break;
    case 'upload':
        routeUpload($action);
        break;
    case 'about':
        routeAbout();
        break;
    default:
        res(400, ['message' => 'Invalid route']);
}

// ============================================
// AUTH ROUTES
// ============================================
function routeAuth($action)
{
    switch ($action) {
        case 'login':
            authLogin();
            break;
        case 'register':
            authRegister();
            break;
        case 'google':
            authGoogle();
            break;
        case 'session':
            authSession();
            break;
        case 'logout':
            authLogout();
            break;
        default:
            res(400, ['message' => 'Invalid action']);
    }
}

function authLogin()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $b = body();
    $email = trim($b['email'] ?? '');
    $password = $b['password'] ?? '';
    if (!validEmail($email) || empty($password)) res(400, ['message' => 'Valid email and password required']);
    $db = getDB();
    $s = $db->prepare('SELECT * FROM users WHERE email = ?');
    $s->execute([$email]);
    $u = $s->fetch();
    if (!$u || !password_verify($password, $u['password_hash'])) res(401, ['message' => 'Invalid email or password']);
    $_SESSION['user_id'] = $u['id'];
    unset($u['password_hash']);
    res(200, ['message' => 'Login successful', 'user' => $u]);
}

function authRegister()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $b = body();
    $name = san($b['name'] ?? '');
    $email = trim($b['email'] ?? '');
    $password = $b['password'] ?? '';
    $phone = san($b['phone'] ?? '');
    $role = san($b['role'] ?? 'tenant');
    // Only allow these roles during registration
    $validRoles = ['tenant', 'owner', 'hotel_manager'];
    if (!in_array($role, $validRoles)) $role = 'tenant';
    if (empty($name) || !validEmail($email) || strlen($password) < 6) res(400, ['message' => 'Name, valid email, and password (6+ chars) required']);
    $db = getDB();
    // Check if email already exists
    $s = $db->prepare('SELECT id FROM users WHERE email = ?');
    $s->execute([$email]);
    if ($s->fetch()) res(409, ['message' => 'Email already registered']);
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $s = $db->prepare('INSERT INTO users (name, email, password_hash, phone, role) VALUES (?,?,?,?,?)');
    $s->execute([$name, $email, $hash, $phone, $role]);
    $uid = $db->lastInsertId();
    $_SESSION['user_id'] = $uid;
    $s = $db->prepare('SELECT * FROM users WHERE id = ?');
    $s->execute([$uid]);
    $u = $s->fetch();
    unset($u['password_hash']);
    notify($uid, 'system', 'Welcome!', 'Welcome to DarTounsi! Complete your profile to get started.', '#/profile');
    res(201, ['message' => 'Registration successful', 'user' => $u]);
}

function authGoogle()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $b = body();
    $email = trim($b['email'] ?? '');
    $name = san($b['name'] ?? '');
    if (empty($email) || empty($name)) res(400, ['message' => 'Email and name required']);
    $db = getDB();
    $s = $db->prepare('SELECT * FROM users WHERE email = ?');
    $s->execute([$email]);
    $u = $s->fetch();
    if ($u) {
        // Existing user — log them in
        $_SESSION['user_id'] = $u['id'];
        unset($u['password_hash']);
        res(200, ['message' => 'Login successful', 'user' => $u]);
    }
    // New user — create account with @email.tn domain as tenant
    $s = $db->prepare('INSERT INTO users (name, email, google_id, role) VALUES (?,?,?,?)');
    $s->execute([$name, $email, 'google_' . uniqid(), 'tenant']);
    $uid = $db->lastInsertId();
    $_SESSION['user_id'] = $uid;
    $s = $db->prepare('SELECT * FROM users WHERE id = ?');
    $s->execute([$uid]);
    $u = $s->fetch();
    unset($u['password_hash']);
    res(201, ['message' => 'Account created', 'user' => $u]);
}

function authSession()
{
    if (empty($_SESSION['user_id'])) res(200, ['authenticated' => false, 'user' => null]);
    $db = getDB();
    $s = $db->prepare('SELECT * FROM users WHERE id = ?');
    $s->execute([$_SESSION['user_id']]);
    $u = $s->fetch();
    if (!$u) {
        session_destroy();
        res(200, ['authenticated' => false, 'user' => null]);
    }
    unset($u['password_hash']);
    // Get unread notification and message counts
    $n = $db->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0');
    $n->execute([$u['id']]);
    $u['unread_notifications'] = (int)$n->fetchColumn();
    $m = $db->prepare('SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND is_read = 0');
    $m->execute([$u['id']]);
    $u['unread_messages'] = (int)$m->fetchColumn();
    res(200, ['authenticated' => true, 'user' => $u]);
}

function authLogout()
{
    session_destroy();
    res(200, ['message' => 'Logged out']);
}

// ============================================
// USERS ROUTES
// ============================================
function routeUsers($action)
{
    switch ($action) {
        case 'get':
            usersGet();
            break;
        case 'update':
            usersUpdate();
            break;
        case 'stats':
            usersStats();
            break;
        default:
            res(400, ['message' => 'Invalid action']);
    }
}

function usersGet()
{
    $id = param('id');
    if (!$id) res(400, ['message' => 'User ID required']);
    $db = getDB();
    $s = $db->prepare('SELECT id, name, email, avatar_url, banner_url, description, location, role, phone, is_verified, created_at FROM users WHERE id = ?');
    $s->execute([$id]);
    $u = $s->fetch();
    if (!$u) res(404, ['message' => 'User not found']);
    // Count active properties and reviews
    $s = $db->prepare('SELECT COUNT(*) FROM properties WHERE owner_id = ? AND status = "active"');
    $s->execute([$id]);
    $u['properties_count'] = (int)$s->fetchColumn();
    $s = $db->prepare('SELECT COUNT(*) FROM reviews WHERE user_id = ?');
    $s->execute([$id]);
    $u['reviews_count'] = (int)$s->fetchColumn();
    res(200, ['user' => $u]);
}

function usersUpdate()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $uid = auth();
    $b = body();
    $db = getDB();
    $fields = [];
    $params = [];
    // Only update provided fields
    if (isset($b['name']) && !empty(trim($b['name']))) {
        $fields[] = 'name = ?';
        $params[] = san($b['name']);
    }
    if (isset($b['phone'])) {
        $fields[] = 'phone = ?';
        $params[] = san($b['phone']);
    }
    if (isset($b['description'])) {
        $fields[] = 'description = ?';
        $params[] = san($b['description']);
    }
    if (isset($b['location'])) {
        $fields[] = 'location = ?';
        $params[] = san($b['location']);
    }
    if (isset($b['banner_url'])) {
        $fields[] = 'banner_url = ?';
        $params[] = san($b['banner_url']);
    }
    if (isset($b['avatar_url'])) {
        $fields[] = 'avatar_url = ?';
        $params[] = san($b['avatar_url']);
    }
    if (empty($fields)) res(400, ['message' => 'No fields to update']);
    $params[] = $uid;
    $db->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    $s = $db->prepare('SELECT * FROM users WHERE id = ?');
    $s->execute([$uid]);
    $u = $s->fetch();
    unset($u['password_hash']);
    res(200, ['message' => 'Profile updated', 'user' => $u]);
}

function usersStats()
{
    $uid = auth();
    $db = getDB();
    $s = $db->prepare('SELECT COUNT(*) as total, COALESCE(SUM(views_count),0) as views FROM properties WHERE owner_id = ?');
    $s->execute([$uid]);
    $ps = $s->fetch();
    $s = $db->prepare('SELECT COUNT(*) FROM favorites f JOIN properties p ON f.property_id = p.id WHERE p.owner_id = ?');
    $s->execute([$uid]);
    $favs = (int)$s->fetchColumn();
    $s = $db->prepare('SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND is_read = 0');
    $s->execute([$uid]);
    $msgs = (int)$s->fetchColumn();
    res(200, ['listings' => (int)$ps['total'], 'views' => (int)$ps['views'], 'favorites_received' => $favs, 'unread_messages' => $msgs]);
}

// ============================================
// PROPERTIES ROUTES
// ============================================
function routeProperties($action)
{
    switch ($action) {
        case 'list':
            propList();
            break;
        case 'get':
            propGet();
            break;
        case 'create':
            propCreate();
            break;
        case 'update':
            propUpdate();
            break;
        case 'delete':
            propDelete();
            break;
        case 'my':
            propMy();
            break;
        case 'featured':
            propFeatured();
            break;
        default:
            res(400, ['message' => 'Invalid action']);
    }
}

function propList()
{
    $db = getDB();
    $q = "SELECT p.*, u.name as owner_name, u.avatar_url as owner_avatar, u.is_verified as owner_verified, u.phone as owner_phone,
          (SELECT ROUND(AVG(r.rating),1) FROM reviews r WHERE r.property_id = p.id) as avg_rating,
          (SELECT COUNT(*) FROM reviews r WHERE r.property_id = p.id) as review_count
          FROM properties p JOIN users u ON p.owner_id = u.id WHERE p.status = 'active'";
    $params = [];
    // Apply filters
    if ($c = param('city')) {
        $q .= ' AND LOWER(p.city) = LOWER(?)';
        $params[] = $c;
    }
    if ($t = param('type')) {
        $q .= ' AND p.type = ?';
        $params[] = $t;
    }
    if ($mp = param('min_price')) {
        $q .= ' AND p.price >= ?';
        $params[] = (float)$mp;
    }
    if ($xp = param('max_price')) {
        $q .= ' AND p.price <= ?';
        $params[] = (float)$xp;
    }
    if ($bd = param('bedrooms')) {
        $q .= ' AND p.bedrooms >= ?';
        $params[] = (int)$bd;
    }
    if (param('furnished') !== null) {
        $q .= ' AND p.is_furnished = ?';
        $params[] = (int)param('furnished');
    }
    if ($nb = param('neighborhood')) {
        $q .= ' AND LOWER(p.neighborhood) LIKE LOWER(?)';
        $params[] = "%$nb%";
    }
    if ($s = param('q')) {
        $q .= ' AND (p.title LIKE ? OR p.description LIKE ? OR p.city LIKE ? OR p.neighborhood LIKE ?)';
        $l = "%$s%";
        $params = array_merge($params, [$l, $l, $l, $l]);
    }
    if (param('premium')) $q .= ' AND p.is_premium = 1';
    // Apply sorting
    $sort = param('sort', 'newest');
    switch ($sort) {
        case 'price_low':
            $q .= ' ORDER BY p.price ASC';
            break;
        case 'price_high':
            $q .= ' ORDER BY p.price DESC';
            break;
        case 'rating':
            $q .= ' ORDER BY avg_rating DESC';
            break;
        case 'views':
            $q .= ' ORDER BY p.views_count DESC';
            break;
        default:
            $q .= ' ORDER BY p.is_premium DESC, p.created_at DESC';
    }
    res(200, paginate($q, $params, param('page', 1), 12));
}

function propGet()
{
    $id = param('id');
    if (!$id) res(400, ['message' => 'ID required']);
    $db = getDB();
    $s = $db->prepare("SELECT p.*, u.name as owner_name, u.avatar_url as owner_avatar, u.is_verified as owner_verified, u.phone as owner_phone, u.email as owner_email,
        (SELECT ROUND(AVG(r.rating),1) FROM reviews r WHERE r.property_id = p.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.property_id = p.id) as review_count
        FROM properties p JOIN users u ON p.owner_id = u.id WHERE p.id = ?");
    $s->execute([$id]);
    $p = $s->fetch();
    if (!$p) res(404, ['message' => 'Property not found']);
    // Increment view count
    $db->prepare('UPDATE properties SET views_count = views_count + 1 WHERE id = ?')->execute([$id]);
    // Fetch reviews
    $s = $db->prepare('SELECT r.*, u.name as user_name, u.avatar_url as user_avatar FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.property_id = ? ORDER BY r.created_at DESC LIMIT 10');
    $s->execute([$id]);
    $p['reviews'] = $s->fetchAll();
    // Neighborhood safety
    if ($p['neighborhood']) {
        $s = $db->prepare('SELECT * FROM area_safety WHERE city = ? AND neighborhood = ?');
        $s->execute([$p['city'], $p['neighborhood']]);
        $p['safety'] = $s->fetch() ?: null;
    }
    // Similar properties
    $s = $db->prepare("SELECT id, title, price, city, type, bedrooms, images FROM properties WHERE id != ? AND status = 'active' AND (city = ? OR type = ?) LIMIT 4");
    $s->execute([$id, $p['city'], $p['type']]);
    $p['similar'] = $s->fetchAll();
    // Check if logged-in user has favorited or requested this property
    if (!empty($_SESSION['user_id'])) {
        $uid = $_SESSION['user_id'];
        $f = $db->prepare('SELECT id FROM favorites WHERE user_id = ? AND property_id = ?');
        $f->execute([$uid, $id]);
        $p['is_favorited'] = (bool)$f->fetch();
        $rr = $db->prepare('SELECT status FROM rental_requests WHERE tenant_id = ? AND property_id = ?');
        $rr->execute([$uid, $id]);
        $req = $rr->fetch();
        $p['rental_request_status'] = $req ? $req['status'] : null;
    }
    res(200, ['property' => $p]);
}

function propCreate()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $uid = auth();
    $b = body();
    $db = getDB();
    // Check that user role can create listings
    $s = $db->prepare('SELECT role FROM users WHERE id = ?');
    $s->execute([$uid]);
    $role = $s->fetch()['role'];
    if (!in_array($role, ['owner', 'hotel_manager', 'admin', 'super_admin'])) res(403, ['message' => 'Only owners and hotel managers can create listings']);
    $req = ['title', 'type', 'price', 'city'];
    foreach ($req as $f) {
        if (empty($b[$f])) res(400, ['message' => "$f is required"]);
    }
    // Admin/super_admin listings go active immediately, others need approval
    $status = in_array($role, ['admin', 'super_admin']) ? 'active' : 'pending';
    $s = $db->prepare('INSERT INTO properties (owner_id, title, description, type, price, city, neighborhood, address, lat, lng, bedrooms, bathrooms, area_sqm, amenities, images, is_furnished, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    $s->execute([
        $uid,
        san($b['title']),
        $b['description'] ?? '',
        $b['type'],
        (float)$b['price'],
        san($b['city']),
        san($b['neighborhood'] ?? ''),
        san($b['address'] ?? ''),
        $b['lat'] ?? null,
        $b['lng'] ?? null,
        (int)($b['bedrooms'] ?? 1),
        (int)($b['bathrooms'] ?? 1),
        (int)($b['area_sqm'] ?? 0),
        json_encode($b['amenities'] ?? []),
        json_encode($b['images'] ?? []),
        (int)($b['is_furnished'] ?? 0),
        $status
    ]);
    $pid = $db->lastInsertId();
    // Notify admins about pending listings
    if ($status === 'pending') {
        $admins = $db->query("SELECT id FROM users WHERE role IN ('admin','super_admin')")->fetchAll();
        foreach ($admins as $a) {
            notify($a['id'], 'admin', 'New Listing Pending', 'A new property "' . $b['title'] . '" needs approval.', '#/admin');
        }
    }
    res(201, ['message' => $status === 'active' ? 'Property created and published' : 'Property created, pending review', 'id' => $pid]);
}

function propUpdate()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $uid = auth();
    $b = body();
    $id = param('id');
    if (!$id) res(400, ['message' => 'ID required']);
    $db = getDB();
    $s = $db->prepare('SELECT owner_id FROM properties WHERE id = ?');
    $s->execute([$id]);
    $p = $s->fetch();
    if (!$p) res(404, ['message' => 'Property not found']);
    if ($p['owner_id'] != $uid && !isAdminOrSuper($uid)) res(403, ['message' => 'Not authorized']);
    $fields = [];
    $params = [];
    $allowed = ['title', 'description', 'price', 'city', 'neighborhood', 'address', 'lat', 'lng', 'bedrooms', 'bathrooms', 'area_sqm', 'is_furnished'];
    foreach ($allowed as $f) {
        if (isset($b[$f])) {
            $fields[] = "$f = ?";
            $params[] = $b[$f];
        }
    }
    if (isset($b['amenities'])) {
        $fields[] = 'amenities = ?';
        $params[] = json_encode($b['amenities']);
    }
    if (isset($b['images'])) {
        $fields[] = 'images = ?';
        $params[] = json_encode($b['images']);
    }
    if (empty($fields)) res(400, ['message' => 'No fields to update']);
    $params[] = $id;
    $db->prepare('UPDATE properties SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    res(200, ['message' => 'Property updated']);
}

function propDelete()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $uid = auth();
    $id = param('id');
    $db = getDB();
    $s = $db->prepare('SELECT owner_id FROM properties WHERE id = ?');
    $s->execute([$id]);
    $p = $s->fetch();
    if (!$p) res(404, ['message' => 'Property not found']);
    if ($p['owner_id'] != $uid && !isAdminOrSuper($uid)) res(403, ['message' => 'Not authorized']);
    $db->prepare('DELETE FROM properties WHERE id = ?')->execute([$id]);
    res(200, ['message' => 'Property deleted']);
}

function propMy()
{
    $uid = auth();
    $db = getDB();
    $q = "SELECT p.*, (SELECT ROUND(AVG(r.rating),1) FROM reviews r WHERE r.property_id = p.id) as avg_rating,
          (SELECT COUNT(*) FROM reviews r WHERE r.property_id = p.id) as review_count,
          (SELECT COUNT(*) FROM rental_requests rr WHERE rr.property_id = p.id AND rr.status = 'pending') as pending_requests
          FROM properties p WHERE p.owner_id = ? ORDER BY p.created_at DESC";
    $s = $db->prepare($q);
    $s->execute([$uid]);
    res(200, ['data' => $s->fetchAll()]);
}

function propFeatured()
{
    $db = getDB();
    $s = $db->prepare("SELECT p.*, u.name as owner_name, u.is_verified as owner_verified,
        (SELECT ROUND(AVG(r.rating),1) FROM reviews r WHERE r.property_id = p.id) as avg_rating
        FROM properties p JOIN users u ON p.owner_id = u.id
        WHERE p.status = 'active' AND p.is_premium = 1 ORDER BY p.views_count DESC LIMIT 6");
    $s->execute();
    res(200, ['data' => $s->fetchAll()]);
}

// ============================================
// RENTAL REQUESTS ROUTES
// ============================================
function routeRentals($action)
{
    switch ($action) {
        case 'request':
            rentalRequest();
            break;
        case 'my-requests':
            rentalMyRequests();
            break;
        case 'incoming':
            rentalIncoming();
            break;
        case 'accept':
            rentalAccept();
            break;
        case 'reject':
            rentalReject();
            break;
        default:
            res(400, ['message' => 'Invalid action']);
    }
}

function rentalRequest()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $uid = auth();
    $b = body();
    $propId = $b['property_id'] ?? '';
    $message = san($b['message'] ?? '');
    if (!$propId) res(400, ['message' => 'property_id required']);
    $db = getDB();
    // Property must be active
    $s = $db->prepare("SELECT p.*, u.name as owner_name FROM properties p JOIN users u ON p.owner_id = u.id WHERE p.id = ? AND p.status = 'active'");
    $s->execute([$propId]);
    $p = $s->fetch();
    if (!$p) res(404, ['message' => 'Property not found or not available']);
    if ($p['owner_id'] == $uid) res(400, ['message' => 'Cannot request your own property']);
    // No duplicate pending requests
    $s = $db->prepare('SELECT id FROM rental_requests WHERE tenant_id = ? AND property_id = ? AND status = "pending"');
    $s->execute([$uid, $propId]);
    if ($s->fetch()) res(409, ['message' => 'You already have a pending request for this property']);
    $db->prepare('INSERT INTO rental_requests (tenant_id, property_id, owner_id, message) VALUES (?,?,?,?)')->execute([$uid, $propId, $p['owner_id'], $message]);
    // Get tenant name for notification
    $tn = $db->prepare('SELECT name FROM users WHERE id = ?');
    $tn->execute([$uid]);
    $tenantName = $tn->fetch()['name'];
    notify($p['owner_id'], 'rental_request', 'New Rental Request', "$tenantName wants to rent: {$p['title']}", '#/dashboard');
    res(201, ['message' => 'Rental request sent successfully']);
}

function rentalMyRequests()
{
    $uid = auth();
    $db = getDB();
    $s = $db->prepare("SELECT rr.*, p.title as property_title, p.city, p.price, p.type, p.images,
        u.name as owner_name FROM rental_requests rr
        JOIN properties p ON rr.property_id = p.id JOIN users u ON rr.owner_id = u.id
        WHERE rr.tenant_id = ? ORDER BY rr.created_at DESC");
    $s->execute([$uid]);
    res(200, ['data' => $s->fetchAll()]);
}

function rentalIncoming()
{
    $uid = auth();
    $db = getDB();
    $s = $db->prepare("SELECT rr.*, p.title as property_title, p.city, p.price, p.type,
        u.name as tenant_name, u.email as tenant_email, u.phone as tenant_phone, u.avatar_url as tenant_avatar,
        u.description as tenant_description
        FROM rental_requests rr
        JOIN properties p ON rr.property_id = p.id JOIN users u ON rr.tenant_id = u.id
        WHERE rr.owner_id = ? ORDER BY rr.status = 'pending' DESC, rr.created_at DESC");
    $s->execute([$uid]);
    res(200, ['data' => $s->fetchAll()]);
}

function rentalAccept()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $uid = auth();
    $id = param('id');
    if (!$id) res(400, ['message' => 'Request ID required']);
    $db = getDB();
    $s = $db->prepare('SELECT * FROM rental_requests WHERE id = ?');
    $s->execute([$id]);
    $rr = $s->fetch();
    if (!$rr) res(404, ['message' => 'Request not found']);
    if ($rr['owner_id'] != $uid && !isAdminOrSuper($uid)) res(403, ['message' => 'Not authorized']);
    // Accept this request, mark property as rented
    $db->prepare("UPDATE rental_requests SET status = 'accepted' WHERE id = ?")->execute([$id]);
    $db->prepare("UPDATE properties SET status = 'rented' WHERE id = ?")->execute([$rr['property_id']]);
    // Auto-reject all other pending requests for the same property
    $others = $db->prepare("SELECT id, tenant_id FROM rental_requests WHERE property_id = ? AND id != ? AND status = 'pending'");
    $others->execute([$rr['property_id'], $id]);
    $otherReqs = $others->fetchAll();
    $db->prepare("UPDATE rental_requests SET status = 'rejected' WHERE property_id = ? AND id != ? AND status = 'pending'")->execute([$rr['property_id'], $id]);
    // Get property title for notifications
    $pt = $db->prepare('SELECT title FROM properties WHERE id = ?');
    $pt->execute([$rr['property_id']]);
    $title = $pt->fetch()['title'];
    notify($rr['tenant_id'], 'rental_accepted', 'Request Accepted! 🎉', "Great news! Your request for \"$title\" has been accepted!", '#/dashboard');
    foreach ($otherReqs as $o) {
        notify($o['tenant_id'], 'rental_rejected', 'Request Rejected', "Sorry, the property \"$title\" has been rented to someone else.", '#/dashboard');
    }
    res(200, ['message' => 'Tenant accepted. Property marked as rented.']);
}

function rentalReject()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $uid = auth();
    $id = param('id');
    if (!$id) res(400, ['message' => 'Request ID required']);
    $db = getDB();
    $s = $db->prepare('SELECT * FROM rental_requests WHERE id = ?');
    $s->execute([$id]);
    $rr = $s->fetch();
    if (!$rr) res(404, ['message' => 'Request not found']);
    if ($rr['owner_id'] != $uid && !isAdminOrSuper($uid)) res(403, ['message' => 'Not authorized']);
    $db->prepare("UPDATE rental_requests SET status = 'rejected' WHERE id = ?")->execute([$id]);
    $pt = $db->prepare('SELECT title FROM properties WHERE id = ?');
    $pt->execute([$rr['property_id']]);
    $title = $pt->fetch()['title'];
    notify($rr['tenant_id'], 'rental_rejected', 'Request Rejected', "Your request for \"$title\" was not accepted.", '#/dashboard');
    res(200, ['message' => 'Request rejected']);
}

// ============================================
// FAVORITES ROUTES
// ============================================
function routeFavorites($action)
{
    switch ($action) {
        case 'toggle':
            favToggle();
            break;
        case 'list':
            favList();
            break;
        default:
            res(400, ['message' => 'Invalid action']);
    }
}

function favToggle()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $uid = auth();
    $b = body();
    $pid = $b['property_id'] ?? '';
    if (!$pid) res(400, ['message' => 'property_id required']);
    $db = getDB();
    $s = $db->prepare('SELECT id FROM favorites WHERE user_id = ? AND property_id = ?');
    $s->execute([$uid, $pid]);
    if ($s->fetch()) {
        $db->prepare('DELETE FROM favorites WHERE user_id = ? AND property_id = ?')->execute([$uid, $pid]);
        res(200, ['message' => 'Removed from favorites', 'favorited' => false]);
    }
    $db->prepare('INSERT INTO favorites (user_id, property_id) VALUES (?,?)')->execute([$uid, $pid]);
    res(200, ['message' => 'Added to favorites', 'favorited' => true]);
}

function favList()
{
    $uid = auth();
    $db = getDB();
    $s = $db->prepare("SELECT p.*, u.name as owner_name,
        (SELECT ROUND(AVG(r.rating),1) FROM reviews r WHERE r.property_id = p.id) as avg_rating
        FROM favorites f JOIN properties p ON f.property_id = p.id JOIN users u ON p.owner_id = u.id
        WHERE f.user_id = ? ORDER BY f.created_at DESC");
    $s->execute([$uid]);
    res(200, ['data' => $s->fetchAll()]);
}

// ============================================
// REVIEWS ROUTES
// ============================================
function routeReviews($action)
{
    switch ($action) {
        case 'create':
            reviewCreate();
            break;
        case 'list':
            reviewList();
            break;
        default:
            res(400, ['message' => 'Invalid action']);
    }
}

function reviewCreate()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $uid = auth();
    $b = body();
    $pid = $b['property_id'] ?? '';
    $rating = (int)($b['rating'] ?? 0);
    $comment = san($b['comment'] ?? '');
    if (!$pid || $rating < 1 || $rating > 5) res(400, ['message' => 'property_id and rating (1-5) required']);
    $db = getDB();
    $db->prepare('INSERT INTO reviews (user_id, property_id, rating, comment) VALUES (?,?,?,?)')->execute([$uid, $pid, $rating, $comment]);
    // Notify property owner
    $s = $db->prepare('SELECT p.owner_id, p.title FROM properties p WHERE p.id = ?');
    $s->execute([$pid]);
    $p = $s->fetch();
    if ($p) notify($p['owner_id'], 'review', 'New Review', "Your property \"{$p['title']}\" received a {$rating}-star review!", "#/property/$pid");
    res(201, ['message' => 'Review submitted']);
}

function reviewList()
{
    $pid = param('property_id');
    if (!$pid) res(400, ['message' => 'property_id required']);
    $db = getDB();
    $s = $db->prepare('SELECT r.*, u.name as user_name, u.avatar_url as user_avatar FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.property_id = ? ORDER BY r.created_at DESC');
    $s->execute([$pid]);
    res(200, ['data' => $s->fetchAll()]);
}

// ============================================
// MESSAGES ROUTES
// ============================================
function routeMessages($action)
{
    switch ($action) {
        case 'conversations':
            msgConversations();
            break;
        case 'thread':
            msgThread();
            break;
        case 'send':
            msgSend();
            break;
        default:
            res(400, ['message' => 'Invalid action']);
    }
}

function msgConversations()
{
    $uid = auth();
    $db = getDB();
    $s = $db->prepare("SELECT m.*, u.name as other_name, u.avatar_url as other_avatar, p.title as property_title
        FROM messages m
        JOIN users u ON u.id = IF(m.sender_id = ?, m.receiver_id, m.sender_id)
        LEFT JOIN properties p ON m.property_id = p.id
        WHERE (m.sender_id = ? OR m.receiver_id = ?)
        AND m.id IN (SELECT MAX(id) FROM messages WHERE sender_id = ? OR receiver_id = ? GROUP BY LEAST(sender_id,receiver_id), GREATEST(sender_id,receiver_id))
        ORDER BY m.created_at DESC");
    $s->execute([$uid, $uid, $uid, $uid, $uid]);
    res(200, ['conversations' => $s->fetchAll()]);
}

function msgThread()
{
    $uid = auth();
    $oid = param('user_id');
    if (!$oid) res(400, ['message' => 'user_id required']);
    $db = getDB();
    $s = $db->prepare("SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
        FROM messages m JOIN users u ON m.sender_id = u.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at ASC LIMIT 100");
    $s->execute([$uid, $oid, $oid, $uid]);
    $msgs = $s->fetchAll();
    // Mark messages from other user as read
    $db->prepare('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0')->execute([$oid, $uid]);
    $ou = $db->prepare('SELECT id, name, avatar_url, role FROM users WHERE id = ?');
    $ou->execute([$oid]);
    res(200, ['messages' => $msgs, 'other_user' => $ou->fetch()]);
}

function msgSend()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $uid = auth();
    $b = body();
    $rid = $b['receiver_id'] ?? '';
    $content = san($b['content'] ?? '');
    $pid = $b['property_id'] ?? null;
    if (!$rid || !$content) res(400, ['message' => 'receiver_id and content required']);
    $db = getDB();
    $db->prepare('INSERT INTO messages (sender_id, receiver_id, property_id, content) VALUES (?,?,?,?)')->execute([$uid, $rid, $pid, $content]);
    $sn = $db->prepare('SELECT name FROM users WHERE id = ?');
    $sn->execute([$uid]);
    notify($rid, 'message', 'New Message', $sn->fetch()['name'] . ' sent you a message', '#/messages/' . $uid);
    res(201, ['message' => 'Message sent', 'id' => $db->lastInsertId()]);
}

// ============================================
// NOTIFICATIONS ROUTES
// ============================================
function routeNotifications($action)
{
    switch ($action) {
        case 'list':
            notifList();
            break;
        case 'read':
            notifRead();
            break;
        case 'read-all':
            notifReadAll();
            break;
        case 'count':
            notifCount();
            break;
        default:
            res(400, ['message' => 'Invalid action']);
    }
}

function notifList()
{
    $uid = auth();
    res(200, paginate("SELECT * FROM notifications WHERE user_id = ? ORDER BY is_read ASC, created_at DESC", [$uid], param('page', 1), 20));
}

function notifRead()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $uid = auth();
    $id = param('id');
    getDB()->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id = ?')->execute([$uid, $id]);
    res(200, ['message' => 'Marked as read']);
}

function notifReadAll()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $uid = auth();
    getDB()->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')->execute([$uid]);
    res(200, ['message' => 'All marked as read']);
}

function notifCount()
{
    $uid = auth();
    $s = getDB()->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0');
    $s->execute([$uid]);
    res(200, ['count' => (int)$s->fetchColumn()]);
}

// ============================================
// ADMIN ROUTES (admin + super_admin only)
// ============================================
function routeAdmin($action)
{
    $uid = requireRole(['admin', 'super_admin']);
    switch ($action) {
        case 'stats':
            adminStats();
            break;
        case 'users':
            adminUsers();
            break;
        case 'properties':
            adminProperties();
            break;
        case 'verify-user':
            adminVerifyUser();
            break;
        case 'delete-user':
            adminDeleteUser();
            break;
        case 'update-user':
            adminUpdateUser();
            break;
        case 'approve-property':
            adminApproveProperty();
            break;
        case 'delete-property':
            adminDeleteProperty();
            break;
        case 'reports':
            adminReports();
            break;
        case 'resolve-report':
            adminResolveReport();
            break;
        default:
            res(400, ['message' => 'Invalid action']);
    }
}

function adminStats()
{
    $db = getDB();
    $s = [];
    $s['users'] = (int)$db->query('SELECT COUNT(*) FROM users')->fetchColumn();
    $s['properties_active'] = (int)$db->query("SELECT COUNT(*) FROM properties WHERE status = 'active'")->fetchColumn();
    $s['properties_pending'] = (int)$db->query("SELECT COUNT(*) FROM properties WHERE status = 'pending'")->fetchColumn();
    $s['properties_rented'] = (int)$db->query("SELECT COUNT(*) FROM properties WHERE status = 'rented'")->fetchColumn();
    $s['rental_requests'] = (int)$db->query("SELECT COUNT(*) FROM rental_requests WHERE status = 'pending'")->fetchColumn();
    $s['reports'] = (int)$db->query("SELECT COUNT(*) FROM reports WHERE status = 'pending'")->fetchColumn();
    $s['revenue_tnd'] = (float)$db->query("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'completed'")->fetchColumn();
    $roles = $db->query("SELECT role, COUNT(*) as c FROM users GROUP BY role")->fetchAll();
    $s['roles'] = [];
    foreach ($roles as $r) $s['roles'][$r['role']] = (int)$r['c'];
    res(200, ['stats' => $s]);
}

function adminUsers()
{
    $db = getDB();
    $q = "SELECT id, name, email, role, phone, is_verified, location, created_at FROM users";
    $params = [];
    $where = [];
    if ($s = param('q')) {
        $where[] = "(name LIKE ? OR email LIKE ?)";
        $params[] = "%$s%";
        $params[] = "%$s%";
    }
    if ($r = param('role')) {
        $where[] = "role = ?";
        $params[] = $r;
    }
    if (!empty($where)) $q .= ' WHERE ' . implode(' AND ', $where);
    $q .= " ORDER BY FIELD(role,'super_admin','admin','owner','hotel_manager','tenant'), created_at DESC";
    res(200, paginate($q, $params, param('page', 1), 20));
}

function adminProperties()
{
    $db = getDB();
    $q = "SELECT p.*, u.name as owner_name, u.email as owner_email FROM properties p JOIN users u ON p.owner_id = u.id";
    $params = [];
    $where = [];
    if ($st = param('status')) {
        $where[] = "p.status = ?";
        $params[] = $st;
    }
    if ($s = param('q')) {
        $where[] = "(p.title LIKE ? OR p.city LIKE ?)";
        $params[] = "%$s%";
        $params[] = "%$s%";
    }
    if (!empty($where)) $q .= ' WHERE ' . implode(' AND ', $where);
    $q .= " ORDER BY p.created_at DESC";
    res(200, paginate($q, $params, param('page', 1), 20));
}

function adminVerifyUser()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $id = param('id');
    $status = param('status', 1);
    $db = getDB();
    // Cannot modify super_admin unless you are super_admin
    $s = $db->prepare('SELECT role FROM users WHERE id = ?');
    $s->execute([$id]);
    $target = $s->fetch();
    if ($target && $target['role'] === 'super_admin' && !isSuperAdmin()) res(403, ['message' => 'Cannot modify the Super Administrator']);
    $db->prepare('UPDATE users SET is_verified = ? WHERE id = ?')->execute([(int)$status, $id]);
    if ($status == 1) notify($id, 'system', 'Account Verified ✓', 'Your account has been verified by an administrator.');
    res(200, ['message' => 'User verification updated']);
}

function adminDeleteUser()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $id = param('id');
    $db = getDB();
    // PROTECTION: Cannot delete super_admin
    $s = $db->prepare('SELECT role, email FROM users WHERE id = ?');
    $s->execute([$id]);
    $target = $s->fetch();
    if (!$target) res(404, ['message' => 'User not found']);
    if ($target['role'] === 'super_admin') res(403, ['message' => 'The Super Administrator cannot be deleted']);
    if ($id == $_SESSION['user_id']) res(400, ['message' => 'Cannot delete yourself']);
    if ($target['role'] === 'admin' && !isSuperAdmin()) res(403, ['message' => 'Only the Super Admin can delete administrators']);
    $db->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    res(200, ['message' => 'User deleted']);
}

function adminUpdateUser()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $id = param('id');
    $b = body();
    $db = getDB();
    // PROTECTION: Cannot modify super_admin unless you ARE the super_admin
    $s = $db->prepare('SELECT role FROM users WHERE id = ?');
    $s->execute([$id]);
    $target = $s->fetch();
    if (!$target) res(404, ['message' => 'User not found']);
    if ($target['role'] === 'super_admin' && !isSuperAdmin()) res(403, ['message' => 'Cannot modify the Super Administrator']);
    $fields = [];
    $params = [];
    if (isset($b['name'])) {
        $fields[] = 'name = ?';
        $params[] = san($b['name']);
    }
    if (isset($b['phone'])) {
        $fields[] = 'phone = ?';
        $params[] = san($b['phone']);
    }
    if (isset($b['is_verified'])) {
        $fields[] = 'is_verified = ?';
        $params[] = (int)$b['is_verified'];
    }
    if (isset($b['location'])) {
        $fields[] = 'location = ?';
        $params[] = san($b['location']);
    }
    // ROLE CANNOT BE CHANGED - this is by design
    if (empty($fields)) res(400, ['message' => 'No fields to update']);
    $params[] = $id;
    $db->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    res(200, ['message' => 'User updated']);
}

function adminApproveProperty()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $id = param('id');
    $status = param('status');
    if (!in_array($status, ['active', 'rejected', 'pending'])) res(400, ['message' => 'Invalid status']);
    $db = getDB();
    $db->prepare('UPDATE properties SET status = ? WHERE id = ?')->execute([$status, $id]);
    $s = $db->prepare('SELECT owner_id, title FROM properties WHERE id = ?');
    $s->execute([$id]);
    $p = $s->fetch();
    if ($p) {
        $msg = $status === 'active' ? "Your property \"{$p['title']}\" has been approved!" : "Your property \"{$p['title']}\" status: $status";
        notify($p['owner_id'], 'admin', 'Property Status Update', $msg, '#/dashboard');
    }
    res(200, ['message' => "Property status: $status"]);
}

function adminDeleteProperty()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $id = param('id');
    getDB()->prepare('DELETE FROM properties WHERE id = ?')->execute([$id]);
    res(200, ['message' => 'Property deleted']);
}

function adminReports()
{
    $db = getDB();
    $q = "SELECT r.*, p.title as property_title, u.name as reporter_name FROM reports r
          JOIN properties p ON r.property_id = p.id JOIN users u ON r.reporter_id = u.id
          ORDER BY r.status = 'pending' DESC, r.created_at DESC";
    res(200, paginate($q, [], param('page', 1), 20));
}

function adminResolveReport()
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    $id = param('id');
    getDB()->prepare("UPDATE reports SET status = 'resolved' WHERE id = ?")->execute([$id]);
    res(200, ['message' => 'Report resolved']);
}

// ============================================
// MATCHMAKING ROUTES
// ============================================
function routeMatchmaking($action)
{
    switch ($action) {
        case 'profile':
            matchProfile();
            break;
        case 'matches':
            matchList();
            break;
        default:
            res(400, ['message' => 'Invalid action']);
    }
}

function matchProfile()
{
    $uid = auth();
    $db = getDB();
    if (method() === 'POST') {
        $b = body();
        $s = $db->prepare('SELECT id FROM matchmaking_profiles WHERE user_id = ?');
        $s->execute([$uid]);
        $data = [$b['sleep_schedule'] ?? 'flexible', $b['noise_level'] ?? 'moderate', (int)($b['is_smoker'] ?? 0), (int)($b['pets_allowed'] ?? 0), $b['cleanliness'] ?? 'moderate', $b['guest_policy'] ?? 'sometimes', (float)($b['budget_min'] ?? 0), (float)($b['budget_max'] ?? 0), san($b['preferred_city'] ?? ''), san($b['preferred_neighborhood'] ?? ''), san($b['bio'] ?? '')];
        if ($s->fetch()) {
            $db->prepare('UPDATE matchmaking_profiles SET sleep_schedule=?, noise_level=?, is_smoker=?, pets_allowed=?, cleanliness=?, guest_policy=?, budget_min=?, budget_max=?, preferred_city=?, preferred_neighborhood=?, bio=? WHERE user_id=?')
                ->execute(array_merge($data, [$uid]));
        } else {
            $db->prepare('INSERT INTO matchmaking_profiles (user_id,sleep_schedule,noise_level,is_smoker,pets_allowed,cleanliness,guest_policy,budget_min,budget_max,preferred_city,preferred_neighborhood,bio) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
                ->execute(array_merge([$uid], $data));
        }
        res(200, ['message' => 'Profile saved']);
    }
    $s = $db->prepare('SELECT * FROM matchmaking_profiles WHERE user_id = ?');
    $s->execute([$uid]);
    res(200, ['profile' => $s->fetch() ?: null]);
}

function matchList()
{
    $uid = auth();
    $db = getDB();
    $s = $db->prepare("SELECT mr.*, ua.name as user_a_name, ua.avatar_url as user_a_avatar, ub.name as user_b_name, ub.avatar_url as user_b_avatar
        FROM match_results mr JOIN users ua ON mr.user_a_id = ua.id JOIN users ub ON mr.user_b_id = ub.id
        WHERE mr.user_a_id = ? OR mr.user_b_id = ? ORDER BY mr.compatibility_score DESC");
    $s->execute([$uid, $uid]);
    res(200, ['data' => $s->fetchAll()]);
}

// ============================================
// FILE UPLOAD ROUTE
// ============================================
function routeUpload($action)
{
    if (method() !== 'POST') res(405, ['message' => 'POST required']);
    auth();
    if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
    if (empty($_FILES['file'])) res(400, ['message' => 'No file uploaded']);
    $file = $_FILES['file'];
    $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!in_array($file['type'], $allowed)) res(400, ['message' => 'Invalid file type']);
    if ($file['size'] > 5 * 1024 * 1024) res(400, ['message' => 'File too large (max 5MB)']);
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $name = uniqid('img_') . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], UPLOAD_DIR . $name)) res(500, ['message' => 'Upload failed']);
    res(200, ['url' => 'uploads/' . $name]);
}

// ============================================
// ABOUT PAGE ROUTE — Returns scrum team info
// ============================================
function routeAbout()
{
    res(200, [
        'team' => [
            ['name' => 'Yassine Lamouchi', 'role' => 'Product Owner', 'description' => 'Visionary leader guiding the product direction and ensuring DarTounsi meets user needs.'],
            ['name' => 'Mohamed Khabou', 'role' => 'Scrum Master', 'description' => 'Facilitates the agile process, removes blockers, and keeps the team on track.'],
            ['name' => 'Aymen Majdoub', 'role' => 'Developer', 'description' => 'Full-stack developer building core platform features.'],
            ['name' => 'Adem Loukil', 'role' => 'Developer', 'description' => 'Backend specialist focusing on API and database architecture.'],
            ['name' => 'Raed Guesmi', 'role' => 'Developer', 'description' => 'Frontend developer crafting the user interface and experience.'],
            ['name' => 'Mohamed Amin Guirat', 'role' => 'Developer', 'description' => 'Quality assurance and integration testing specialist.']
        ]
    ]);
}
