(function(){
  var canvasEl = document.getElementById('canvas');
  var ctx = canvasEl.getContext('2d');

  var backgroundColor = '#000';
  var nodeColor = '#0a32c8';
  var edgeColor = '#0527af';
  var packetColor = '#2f5af0';
  var packetSpeed = 6;
  var radiusOfNode = 30;

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

      receive(receivedPacket){
        console.log(receivedPacket.segment);
        var receive = receivedPacket.segment;
        var acknum = receive.acknowledgment_number;
        var seqnum = receive.sequence_number;

        if(acknum + seqnum <= 2 || !acknum  ) Three_way_handshake.call(this);

        function Three_way_handshake(){
          if(receive.SYN){
            var packet = new Packet(this,this.link);

            if(receive.acknowledgment_number > 0){
              console.log('TCP connection establish successfully!');
              packet.segment = {
                SYN : 0,
                sequence_number : receive.acknowledgment_number,
                acknowledgment_number : receive.sequence_number+1
              };
            }else{
              packet.segment = {
                SYN : 1,
                sequence_number : 0,
                acknowledgment_number : receive.sequence_number + 1
              };
            }
          }else{
            console.log('Three-way handshake OK!');
          }
        }

        var index = PACKETS.indexOf(receivedPacket);
        PACKETS.splice(index, 1);
      }

      EstablishConnection(destination){
        var packet = new Packet(this,destination);

        packet.segment = {
          SYN : 1,
          sequence_number : 0,
        };
      }
  }

  class Packet extends EventEmitter{
      constructor(origin,destination){
        super();
        var distance = Math.sqrt(Math.pow((origin.x - destination.x), 2) + Math.pow((origin.y - destination.y), 2));

        this.origin = origin;
        this.destination = destination;
        this.sin = (destination.y - origin.y) / distance;
        this.cos = (destination.x - origin.x) / distance;
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
        origin.link = destination;
        destination.link = origin;
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

  NODES[0].EstablishConnection(NODES[1]);

})();
