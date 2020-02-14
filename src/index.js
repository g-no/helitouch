import {Button, TextView, contentView} from 'tabris';

contentView.append(
  <$>
    <Button center onSelect={showText}>Tap the Button</Button>
    <TextView centerX bottom='prev() 20' font='24px'/>
  </$>
);

function showText() {
  $(TextView).only().text = 'You rock!';
}
