import React from 'react';
import io from 'socket.io-client';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import './style.css';

class Board extends React.Component {
  timeout;
  socket = io.connect('http://localhost:8080');
  user_id;
  isEmitting = false;

  ctx;
  isDrawing = false;
  hasInput = false;

  constructor(props) {
    super(props);

    this.socket.on('canvas-data', function (data) {
      var root = this;
      var interval = setInterval(function () {
        if (root.isDrawing) return;
        root.isDrawing = true;
        clearInterval(interval);
        var image = new Image();
        var canvas = document.querySelector('#board');
        var ctx = canvas.getContext('2d');
        image.onload = function () {
          ctx.drawImage(image, 0, 0);

          root.isDrawing = false;
        };
        image.src = data;
      }, 50);
    });
  }

  componentDidMount() {
    this.drawOnCanvas();
  }

  componentWillReceiveProps(newProps) {
    /*console.log(this.props.auth);
    this.socket.emit('add-user', this.props.auth.user.name);
    var that = this;
    this.socket.on('user-added', function (data) {
      if (data.name === that.auth.user.name) {
        that.user_id = data.id;
      }
    });*/
    this.ctx.strokeStyle = newProps.color;
    this.ctx.lineWidth = newProps.size;
  }

  drawOnCanvas() {
    var canvas = document.querySelector('#board');
    this.ctx = canvas.getContext('2d');
    var ctx = this.ctx;

    var sketch = document.querySelector('#sketch');
    var sketch_style = getComputedStyle(sketch);
    canvas.width = parseInt(sketch_style.getPropertyValue('width'));
    canvas.height = parseInt(sketch_style.getPropertyValue('height'));

    var mouse = { x: 0, y: 0 };
    var last_mouse = { x: 0, y: 0 };

    /* Mouse Capturing Work */
    canvas.addEventListener(
      'mousemove',
      function (e) {
        last_mouse.x = mouse.x;
        last_mouse.y = mouse.y;

        mouse.x = e.pageX - this.offsetLeft;
        mouse.y = e.pageY - this.offsetTop;
      },
      false
    );

    /* Drawing on Paint App */
    ctx.lineWidth = this.props.size;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = this.props.color;

    canvas.addEventListener(
      'mousedown',
      function (e) {
        canvas.addEventListener('mousemove', onPaint, false);
      },
      false
    );

    canvas.addEventListener(
      'mouseup',
      function () {
        canvas.removeEventListener('mousemove', onPaint, false);
      },
      false
    );

    var root = this;
    var onPaint = function () {
      ctx.beginPath();
      ctx.moveTo(last_mouse.x, last_mouse.y);
      ctx.lineTo(mouse.x, mouse.y);
      ctx.closePath();
      ctx.stroke();
      //console.log('props ' + root.props.auth.user.role);
      if (root.timeout !== undefined) clearTimeout(root.timeout);
      if (root.props.auth.user && root.props.auth.user.role === 'Instructor') {
        root.timeout = setTimeout(function () {
          var base64ImageData = canvas.toDataURL('image/png');
          root.socket.emit('canvas-data', base64ImageData);
        }, 50);
      }
    };

    //Key handler for input box:
    var handleEnter = function (e) {
      var keyCode = e.keyCode;
      if (keyCode === 13) {
        drawText(
          this.value,
          parseInt(this.style.left, 10),
          parseInt(this.style.top, 10)
        );
        document.body.removeChild(this);
        root.hasInput = false;

        if (root.timeout !== undefined) clearTimeout(root.timeout);
        if (
          root.props.auth.user &&
          root.props.auth.user.role === 'Instructor'
        ) {
          root.timeout = setTimeout(function () {
            var base64ImageData = canvas.toDataURL('image/png');
            root.socket.emit('canvas-data', base64ImageData);
          }, 50);
        }
      }
    };

    //Draw the text onto canvas:
    var drawText = function (txt, x, y) {
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.font = '14px sans-serif';
      ctx.fillText(txt, x - 4, y - 4);
    };

    var addInput = function (x, y) {
      var input = document.createElement('textarea');

      //input.type = "text";
      input.style.position = 'fixed';
      input.style.left = x - 4 + 'px';
      input.style.top = y - 4 + 'px';

      input.onkeydown = handleEnter;

      document.body.appendChild(input);

      input.focus();

      root.hasInput = true;
    };

    canvas.addEventListener(
      'dblclick',
      function (e) {
        if (root.hasInput) return;
        addInput(e.clientX, e.clientY);
      },
      false
    );
  }

  render() {
    return (
      <div class="sketch" id="sketch">
        <canvas className="board" id="board"></canvas>
      </div>
    );
  }
}

Board.propTypes = {
  auth: PropTypes.object.isRequired
};

const mapStateToProps = (state, ownProps) => ({
  auth: state.auth,
  sentProps: ownProps
});

export default connect(mapStateToProps, undefined)(Board);
