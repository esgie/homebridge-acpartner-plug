require('./Base');

const inherits = require('util').inherits;
const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;

ACPartnerPlugBase = function(platform, config) {
    this.init(platform, config);
    
    Accessory = platform.Accessory;
    PlatformAccessory = platform.PlatformAccessory;
    Service = platform.Service;
    Characteristic = platform.Characteristic;
    UUIDGen = platform.UUIDGen;
    
    this.device = new miio.Device({
        address: this.config['ip'],
        token: this.config['token']
    });
    
    this.accessories = {};
    if(!this.config['outletDisable'] && this.config['outletName'] && this.config['outletName'] != "") {
        this.accessories['outletAccessory'] = new ACPartnerPlugBaseOutlet(this);
    }
    var accessoriesArr = this.obj2array(this.accessories);
    
    this.platform.log.debug("[MiOutletPlatform][DEBUG]Initializing " + this.config["type"] + " device: " + this.config["ip"] + ", accessories size: " + accessoriesArr.length);
    
    return accessoriesArr;
}
inherits(ACPartnerPlugBase, Base);

ACPartnerPlugBaseOutlet = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['outletName'];
    this.platform = dThis.platform;
}

ACPartnerPlugBaseOutlet.prototype.getServices = function() {
    var services = [];

    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "Plug Base")
        .setCharacteristic(Characteristic.SerialNumber, "Undefined");
    services.push(infoService);
    
    var outletService = new Service.Outlet(this.name);
    outletService
        .getCharacteristic(Characteristic.On)
        .on('get', this.getPower.bind(this))
        .on('set', this.setPower.bind(this));
    outletService
        .getCharacteristic(Characteristic.OutletInUse)
        .on('get', this.getOutletInUse.bind(this));
    services.push(outletService);

    return services;
}

ACPartnerPlugBaseOutlet.prototype.getOutletInUse = function(callback) {
    var that = this;
    this.device.call("get_device_prop", ["lumi.0","plug_state"]).then(result => {
        that.platform.log.debug("[MiOutletPlatform][DEBUG]ACPartnerPlugBase - Outlet - getOutletInUse: " + result);
        callback(null, result[0] === 'on' ? true : false);
    }).catch(function(err) {
        that.platform.log.error("[MiOutletPlatform][ERROR]ACPartnerPlugBase - Outlet - getOutletInUse Error: " + err);
        callback(err);
    });
}

ACPartnerPlugBaseOutlet.prototype.getPower = function(callback) {
    var that = this;
    this.device.call("get_device_prop", ["lumi.0","plug_state"]).then(result => {
        that.platform.log.debug("[MiOutletPlatform][DEBUG]ACPartnerPlugBase- Outlet - getPower: " + result);
        callback(null, result[0] === 'on' ? true : false);
    }).catch(function(err) {
        that.platform.log.error("[MiOutletPlatform][ERROR]ACPartnerPlugBase - Outlet - getPower Error: " + err);
        callback(err);
    });
}

ACPartnerPlugBaseOutlet.prototype.setPower = function(value, callback) {
    var that = this;
    that.device.call("toggle_plug", [value ? "on" : "off"]).then(result => {
        that.platform.log.debug("[MiOutletPlatform][DEBUG]ACPartnerPlugBase - Outlet - setPower Result: " + result);
        if(result[0] === "ok") {
            callback(null);
        } else {
            callback(new Error(result[0]));
        }
    }).catch(function(err) {
        that.platform.log.error("[MiOutletPlatform][ERROR]ACPartnerPlugBase - Outlet - setPower Error: " + err);
        callback(err);
    });
}

