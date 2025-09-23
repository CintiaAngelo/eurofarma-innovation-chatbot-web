import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AdminComponent } from './admin';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminComponent,
        FormsModule // necessário por causa do [(ngModel)]
      ],
      schemas: [NO_ERRORS_SCHEMA] // ignora tags desconhecidas como <ckeditor>
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should change tab when selectTab is called', () => {
    component.selectTab('ideas');
    expect(component.activeTab).toBe('ideas');
  });

  it('should open and close modal', () => {
    component.openNewsletterModal();
    expect(component.showModal).toBeTrue();

    component.closeModal();
    expect(component.showModal).toBeFalse();
  });

  it('should enter edit mode when editIdea is called', () => {
    const mockIdea = { id_ideia: 1, titulo_ideia: 'Teste', status_ideia: 'Submetida' };
    component.editIdea(mockIdea);
    expect(component.isEditing).toBeTrue();
    expect(component.modalIdea).toEqual(mockIdea);
  });
});
