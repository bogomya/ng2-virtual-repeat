import {
  Component, OnInit, Input, IterableDiffer, TemplateRef,
  ChangeDetectorRef, IterableDiffers, DoCheck, ElementRef, ContentChild, ViewChild, AfterViewInit
} from '@angular/core';
import {Observable} from "rxjs";

@Component({
  selector: 'virtual-repeat',
  templateUrl: './virtual-repeat.component.html',
  styles: [require('virtual-repeat.component.scss')]
})
export class VirtualRepeatComponent implements OnInit, DoCheck, AfterViewInit {
  @Input() set elements(items: Array<any>) {
    this.items = items;
    if (this.items && !this.differ) {
      this.differ = this.differs.find(items).create(this.changeDetector);
    }
  }
  // Size item in px (height - for vertical scrolling, width - for horizontal)
  @Input() itemSize ?: number = 30;
  @Input() horizontal ?: boolean = true;
  @ContentChild(TemplateRef) itemTemplate: TemplateRef<any>;
  @ViewChild('scroller') scroller: ElementRef;
  @ViewChild('sizer') sizer: ElementRef;
  @ViewChild('offsetter') offsetter: ElementRef;

  private items: Array<any>;
  private differ: IterableDiffer;

  /* The scroll width or height */
  private scrollSize: number = 0;
  /* last scrollLeft or scrollTop of the scroller */
  private scrollOffset: number = 0;

  /* Most recent starting repeat index (based on scroll offset) */
  private newStartIndex: number = 0;
  /* Most recent ending repeat index (based on scroll offset) */
  private newEndIndex: number = 0;
  /* Previous starting repeat index (based on scroll offset) */
  private startIndex: number = 0;
  /* Previous ending repeat index (based on scroll offset) */
  private endIndex: number = 0;
  /* The width or height of the container */
  private hostSize: number = 0;

  private displayedItems: Array<any> = [];
  /* Most recently seen length of items. */
  private itemsLength = 0;

  private NUM_EXTRA = 3;

  constructor(
    private ref: ElementRef,
    private changeDetector: ChangeDetectorRef,
    private differs: IterableDiffers
  ) {}

  ngOnInit() {
    if (this.horizontal) {
      this.ref.nativeElement.classList.add('repeat-horizontal');
    }
  }

  ngDoCheck(): void {
    if (this.differ) {
      let changes = this.differ.diff(this.items);
      if (changes) {
        this.updateContainerSize();
      }
    }
  }

  ngAfterViewInit(): void {
    //TODO 'scroll wheel touchmove touchend'
    Observable
      .fromEvent(this.scroller.nativeElement, 'scroll')
      .debounceTime(5)
      .subscribe(() => {
        this.handleScroll();
      })
    ;
  }

  // Instructs the container to re-measure its size.
  private updateContainerSize() {
    this.hostSize = this.isHorizontal() ?
      this.ref.nativeElement.clientWidth :
      this.ref.nativeElement.clientHeight
    ;

    this.handleScroll();
    this.containerUpdated();
  }

  private updateIndexes() {
    const itemsLength = this.items ? this.items.length : 0;
    const containerLength = Math.ceil(this.hostSize / this.itemSize);
    //
    this.newStartIndex = Math.max(0, Math.min(
      itemsLength - containerLength,
      Math.floor(this.scrollOffset / this.itemSize)));
    this.newEndIndex = Math.min(itemsLength, this.newStartIndex + containerLength + this.NUM_EXTRA);
    this.newStartIndex = Math.max(0, this.newStartIndex - this.NUM_EXTRA);
  }

  private handleScroll() : void {
    const scrollerElement = this.scroller.nativeElement;
    const offset = this.isHorizontal() ? scrollerElement.scrollLeft : scrollerElement.scrollTop;

    if (offset === this.scrollOffset || offset > this.scrollSize - this.itemSize) return;
    const numItems = Math.max(0, Math.floor(offset / this.itemSize) - this.NUM_EXTRA);
    const transform = (this.isHorizontal() ? 'translateX(' : 'translateY(') + numItems * this.itemSize + 'px)';
    this.scrollOffset = offset;

    const offsetterElement = this.offsetter.nativeElement;
    offsetterElement.style.webkitTransform = transform;
    offsetterElement.style.transform = transform;

    this.containerUpdated();
  }


  // Called when containers scroll or hostSize has changed.
  private containerUpdated() {
    this.updateIndexes();

    if (this.newStartIndex !== this.startIndex ||
        this.newEndIndex !== this.endIndex ||
        this.scrollOffset > this.scrollSize) {
      this.virtualRepeatUpdate(this.items, this.items);
    }
  }

  private virtualRepeatUpdate(items: Array<any>, oldItems: Array<any>) {
    const itemsLength = items && items.length || 0;
    let lengthChanged = false;

    if (itemsLength !== this.itemsLength) {
      lengthChanged = true;
      this.itemsLength = itemsLength;
    }
    this.items = items;

    if (items !== oldItems || lengthChanged) {
      this.updateIndexes();
    }

    if (lengthChanged) {
      this.setScrollSize(itemsLength * this.itemSize);
    }

    this.displayedItems = this.items.slice(this.newStartIndex, this.newEndIndex);

    this.startIndex = this.newStartIndex;
    this.endIndex = this.newEndIndex;
  }

  private setScrollSize(itemsSize : number) : void {
    if (this.scrollSize == itemsSize) return;
    this.scrollSize = itemsSize;
    this.sizeScroller(itemsSize);
  }

  private sizeScroller(size: number) {
    this.sizer.nativeElement[this.getDimensionName()] = size + 'px';
  }

  private getDimensionName() {
    return this.isHorizontal() ? 'width' : 'height';
  }

  private isHorizontal() {
    return this.horizontal;
  }
}
