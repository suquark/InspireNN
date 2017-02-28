function set_preload_mask() {
    document.body.innerHTML += `<div class="preloader-mask" style="width: 100%; height: 100%; left: 0; top: 0; z-index: 1002; display: block; opacity: 0.5; position: fixed; background:black"> </div>
<div class="preloader-mask" style="position: fixed; left: 45%; top: 45%;  z-index: 1003;">
    <div class="preloader-wrapper big active">
        <div class="spinner-layer spinner-blue">
            <div class="circle-clipper left">
                <div class="circle"></div>
            </div>
            <div class="gap-patch">
                <div class="circle"></div>
            </div>
            <div class="circle-clipper right">
                <div class="circle"></div>
            </div>
        </div>

        <div class="spinner-layer spinner-red">
            <div class="circle-clipper left">
                <div class="circle"></div>
            </div>
            <div class="gap-patch">
                <div class="circle"></div>
            </div>
            <div class="circle-clipper right">
                <div class="circle"></div>
            </div>
        </div>

        <div class="spinner-layer spinner-yellow">
            <div class="circle-clipper left">
                <div class="circle"></div>
            </div>
            <div class="gap-patch">
                <div class="circle"></div>
            </div>
            <div class="circle-clipper right">
                <div class="circle"></div>
            </div>
        </div>

        <div class="spinner-layer spinner-green">
            <div class="circle-clipper left">
                <div class="circle"></div>
            </div>
            <div class="gap-patch">
                <div class="circle"></div>
            </div>
            <div class="circle-clipper right">
                <div class="circle"></div>
            </div>
        </div>
    </div>
</div>`;
}

function disable_preload_mask() {
    var items = document.getElementsByClassName('preloader-mask');
    for (var i = 0; i < items.length; i++) {
        items[i].style.cssText += 'display:none';
    }
}