(function(){
  var canvasEl = document.getElementById('canvas');
  var ctx = canvasEl.getContext('2d');

  var backgroundColor = '#000';
  var nodeColor = '#0a32c8';
  var edgeColor = '#0527af';
  var packetColor = '#2f5af0';
  var packetSpeed = 6;
  var radiusOfNode = 30;

  var locationRuleOfNode = function(x,y){
    return true;
    /*if((x < canvasEl.width/2-200 || x > canvasEl.width/2+200) ||
       (y < canvasEl.height/2-200 || y > canvasEl.height/2+200)){
         return true;
       }else{
         return false
       }*/
  }

  var NODES = [];
  var PACKETS = [];
  var LINKS = [];

  class Node{
      constructor(x,y){
        this.x = x;
        this.y = y;
        this.radius = radiusOfNode;
        this.color = nodeColor;

        this.link;

        NODES.push(this);
      }

      connect(node){
        this.link = node;
      }

      receive(packet){
        var index = PACKETS.indexOf(packet);
        PACKETS.splice(index, 1);
        if(this.address !== packet.address) this.send(packet.address);
      }

      send(destination){
        new Packet(this,destination);
      }
  }

  class Packet extends EventEmitter{
      constructor(origin,destination,address){
        super();
        var distance = Math.sqrt(Math.pow((origin.x - destination.x), 2) + Math.pow((origin.y - destination.y), 2));

        this.origin = origin;
        this.destination = destination;
        this.sin = (destination.y - origin.y) / distance;
        this.cos = (destination.x - origin.x) / distance;
        this.address = address;

        this.x = origin.x;
        this.y = origin.y;

        this.addListener('arrive',function arriveListener(){
          this.removeListener('arrive',arriveListener);
          destination.receive(this);
        });

        PACKETS.push(this);
      }

      arrive(){
        this.emitEvent('arrive');
      }

      move(){
        var distance = Math.sqrt(Math.pow((this.x - this.destination.x), 2) + Math.pow((this.y - this.destination.y), 2));

        if(distance > radiusOfNode){
          this.x += packetSpeed * this.cos;
          this.y += packetSpeed * this.sin;
        }else{
          this.arrive();
        }
      }

  }

  class Link{
      constructor(origin,destination){
        this.origin = origin;
        this.destination = destination;

        LINKS.push(this);
        origin.connect(destination);
        destination.connect(origin);
      }
  }

  function calculus(){
    PACKETS.forEach(function(packet){
      packet.move();
    });

    render();

    window.requestAnimationFrame(calculus);
  }

  function render() {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

    NODES.forEach(function (node) {
      ctx.fillStyle  = node.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      ctx.fill();
    });

    LINKS.forEach(function(link){
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(link.origin.x,link.origin.y);
      ctx.lineTo(link.destination.x,link.destination.y);
      ctx.stroke();
    });

    PACKETS.forEach(function(packet){
      ctx.fillStyle  = packetColor;
      ctx.beginPath();
      ctx.arc(packet.x, packet.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  window.onresize = function () {
    canvasEl.width = document.body.clientWidth;
    canvasEl.height = canvasEl.clientHeight;

    NODES = [];
    LINKS = [];
    PACKETS = [];

    new Node(100,canvasEl.height / 2);
    new Node(1000,canvasEl.height / 2);

    new Link(NODES[0],NODES[1]);

    render();
  };

  window.onresize();
  window.requestAnimationFrame(calculus);

  NODES[0].send(NODES[1]);
  console.log(NODES);

})();
